/**
 * Postgres LISTEN/NOTIFY bridge for the realtime bus.
 *
 * Dev (SQLite)  -> not available, the in-process bus is enough.
 * Prod (Postgres)-> events are published with pg_notify so that *every*
 *                   application instance receives them, not just the one
 *                   that handled the request.
 */
import { Client, Pool } from "pg";

export const PG_CHANNEL = "smart_buzzer_events";

function rawUrl(): string | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!/^postgres(ql)?:\/\//i.test(url)) return null;
  return url;
}

/** pg-connection-string does not understand Prisma-only params like `schema`. */
export function pgConnectionString(): string | null {
  const url = rawUrl();
  if (!url) return null;
  const parsed = new URL(url);
  parsed.searchParams.delete("schema");
  parsed.searchParams.delete("connection_limit");
  parsed.searchParams.delete("pgbouncer");
  return parsed.toString();
}

export function isPostgres(): boolean {
  return rawUrl() !== null;
}

let pool: Pool | null = null;
let listener: Client | null = null;
let listenerStarted = false;
let reconnectTimer: NodeJS.Timeout | null = null;

export async function publishPg(payload: unknown): Promise<void> {
  const url = pgConnectionString();
  if (!url) return;
  try {
    if (!pool) pool = new Pool({ connectionString: url, max: 3 });
    await pool.query("select pg_notify($1, $2)", [PG_CHANNEL, JSON.stringify(payload)]);
  } catch (error) {
    console.error("[realtime] pg_notify failed:", (error as Error).message);
  }
}

/**
 * Starts a dedicated LISTEN connection. `onPayload` receives every event that
 * any instance published. Reconnects with a fixed backoff.
 */
export function startPgListener(onPayload: (payload: unknown) => void): void {
  if (listenerStarted) return;
  const url = pgConnectionString();
  if (!url) return;
  listenerStarted = true;

  const connect = () => {
    const client = new Client({ connectionString: url });
    listener = client;

    client.on("error", (error) => {
      console.error("[realtime] pg listener error:", error.message);
      listenerStarted = false;
      scheduleReconnect(connect);
    });

    client
      .connect()
      .then(() => client.query(`LISTEN ${PG_CHANNEL}`))
      .then(() => {
        client.on("notification", (message) => {
          if (!message.payload) return;
          try {
            onPayload(JSON.parse(message.payload));
          } catch {
            /* ignore malformed payloads */
          }
        });
      })
      .catch((error) => {
        console.error("[realtime] pg connect failed:", error.message);
        listenerStarted = false;
        scheduleReconnect(connect);
      });
  };

  connect();
}

function scheduleReconnect(connect: () => void): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    try {
      connect();
    } catch {
      /* ignore */
    }
  }, 5000);
  // Never keep the process alive just for the realtime bridge.
  reconnectTimer.unref?.();
}

export async function closePg(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    await listener?.end();
  } catch {
    /* ignore */
  }
  try {
    await pool?.end();
  } catch {
    /* ignore */
  }
  listener = null;
  pool = null;
  listenerStarted = false;
}
