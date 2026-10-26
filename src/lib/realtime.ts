/**
 * In-process realtime event bus + Postgres LISTEN/NOTIFY bridge.
 *
 * Customer phones and the POS screen subscribe to channels and receive
 * Server-Sent Events. On a single instance the local EventEmitter is enough;
 * on Postgres the same events are also published with pg_notify so that
 * horizontally scaled deployments stay in sync.
 */
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

import { isPostgres, publishPg, startPgListener } from "./realtime-pg";

export type OrderStatus = "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type OrderEventPayload = {
  id: string;
  type: "order.created" | "order.status" | "order.rebuzz";
  tenantId: string;
  branchId: string;
  orderId: string;
  token: string;
  number: number;
  status: OrderStatus;
  createdAt: string;
};

type Listener = (event: OrderEventPayload) => void;

type BusState = {
  bus: EventEmitter;
  seen: Set<string>;
  seenOrder: string[];
};

const g = globalThis as unknown as { __sbBus?: BusState };

const state: BusState = g.__sbBus ?? { bus: new EventEmitter(), seen: new Set(), seenOrder: [] };
g.__sbBus = state;
state.bus.setMaxListeners(0);

export function channelForOrder(token: string): string {
  return `order:${token}`;
}

export function channelForBranch(branchId: string): string {
  return `branch:${branchId}`;
}

/** Remembers recently delivered ids so an event is never handled twice. */
function markSeen(id: string): boolean {
  if (state.seen.has(id)) return false;
  state.seen.add(id);
  state.seenOrder.push(id);
  if (state.seenOrder.length > 500) {
    const dropped = state.seenOrder.shift();
    if (dropped) state.seen.delete(dropped);
  }
  return true;
}

function deliver(event: OrderEventPayload): void {
  if (!markSeen(event.id)) return;
  state.bus.emit(channelForOrder(event.token), event);
  state.bus.emit(channelForBranch(event.branchId), event);
}

/** Publishes an order event to this instance and (on Postgres) to all others. */
export function publishOrderEvent(
  event: Omit<OrderEventPayload, "id" | "createdAt"> & { id?: string; createdAt?: string },
): OrderEventPayload {
  const full: OrderEventPayload = {
    ...event,
    id: event.id ?? randomUUID(),
    createdAt: event.createdAt ?? new Date().toISOString(),
  };

  deliver(full);

  if (isPostgres()) {
    void publishPg(full);
  }

  return full;
}

/** Subscribes to a channel. Returns an unsubscribe function. */
export function subscribe(channel: string, listener: Listener): () => void {
  state.bus.on(channel, listener);
  return () => {
    state.bus.off(channel, listener);
  };
}

let pgListenerReady = false;

/** Starts the Postgres bridge once, on the first import in a server process. */
export function ensureRealtimeBridge(): void {
  if (pgListenerReady) return;
  pgListenerReady = true;
  if (!isPostgres()) return;
  startPgListener((payload) => {
    const event = payload as OrderEventPayload;
    if (!event || typeof event !== "object" || !event.id) return;
    deliver(event);
  });
}
