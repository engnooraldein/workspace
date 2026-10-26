"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PublicOrder } from "@/lib/types";

type StreamState = {
  order: PublicOrder;
  connected: boolean;
  lastEventAt: number | null;
};

/**
 * Subscribes to the order's Server-Sent Events stream and keeps the order
 * object in sync. Falls back to light polling when the socket is unavailable
 * (flaky mobile networks in Iraq are common).
 */
export function useOrderStream(token: string, initial: PublicOrder): StreamState {
  const [order, setOrder] = useState<PublicOrder>(initial);
  const [connected, setConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    const source = new EventSource(`/api/public/orders/${encodeURIComponent(token)}/stream`);

    source.onopen = () => {
      connectedRef.current = true;
      setConnected(true);
    };

    source.addEventListener("snapshot", (event) => {
      try {
        setOrder(JSON.parse((event as MessageEvent).data) as PublicOrder);
        setLastEventAt(Date.now());
      } catch {
        /* ignore malformed payload */
      }
    });

    const applyStatus = (event: Event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          status: PublicOrder["status"];
          createdAt: string;
        };
        setOrder((previous) => ({
          ...previous,
          status: payload.status,
          readyAt: payload.status === "READY" ? payload.createdAt : previous.readyAt,
          completedAt: payload.status === "COMPLETED" ? payload.createdAt : previous.completedAt,
        }));
        setLastEventAt(Date.now());
      } catch {
        /* ignore malformed payload */
      }
    };

    source.addEventListener("order.status", applyStatus);
    source.addEventListener("order.created", applyStatus);
    source.addEventListener("order.rebuzz", () => {
      setLastEventAt(Date.now());
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sb:order:rebuzz"));
      }
    });

    source.onerror = () => {
      connectedRef.current = false;
      setConnected(false);
      // EventSource reconnects automatically on its own.
    };

    return () => {
      source.close();
      connectedRef.current = false;
    };
  }, [token]);

  // Safety net: poll while the socket is down.
  useEffect(() => {
    if (!token) return;

    const timer = setInterval(async () => {
      if (connectedRef.current) return;
      try {
        const response = await fetch(`/api/public/orders/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const fresh = (await response.json()) as PublicOrder;
        setOrder((previous) =>
          previous.status === fresh.status &&
          previous.rating?.stars === fresh.rating?.stars &&
          previous.createdAt === fresh.createdAt
            ? previous
            : fresh,
        );
        setLastEventAt(Date.now());
      } catch {
        /* offline — retry on the next tick */
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [token]);

  return { order, connected, lastEventAt };
}

/**
 * Buzzer alert: a repeating two-tone chime through the Web Audio API plus a
 * vibration pattern. Browsers only allow audio after a user gesture, so the
 * caller must ask the user to enable sound first.
 */
export function useBuzzerAlert(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const highRef = useRef(false);

  const stop = useCallback(() => {
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    if (vibrateTimerRef.current) {
      clearInterval(vibrateTimerRef.current);
      vibrateTimerRef.current = null;
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }
    const gain = gainRef.current;
    const context = contextRef.current;
    if (gain && context) {
      try {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
      } catch {
        /* ignore */
      }
    }
    highRef.current = false;
  }, []);

  /** Unlocks the AudioContext — must be called from a user gesture. */
  const unlock = useCallback(async () => {
    if (typeof window === "undefined") return false;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;

    if (!contextRef.current) {
      contextRef.current = new Ctor();
      const oscillator = contextRef.current.createOscillator();
      const gain = contextRef.current.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(contextRef.current.destination);
      oscillator.start();
      oscillatorRef.current = oscillator;
      gainRef.current = gain;
    }

    if (contextRef.current.state === "suspended") {
      await contextRef.current.resume();
    }

    return true;
  }, []);

  const start = useCallback(() => {
    // 1. Always trigger continuous buzzer vibration pattern on mobile devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const buzz = () => {
        try {
          navigator.vibrate([400, 150, 400, 150, 800]);
        } catch {
          /* ignore */
        }
      };
      buzz();
      if (vibrateTimerRef.current) clearInterval(vibrateTimerRef.current);
      vibrateTimerRef.current = setInterval(buzz, 2500);
    }

    // 2. Play two-tone buzzer sound
    const playAudio = () => {
      const context = contextRef.current;
      const gain = gainRef.current;
      if (!context || !gain) return;

      if (context.state === "suspended") {
        void context.resume();
      }

      const pulse = () => {
        const now = context.currentTime;
        highRef.current = !highRef.current;

        if (oscillatorRef.current) {
          oscillatorRef.current.frequency.setValueAtTime(highRef.current ? 1175 : 784, now);
        }

        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
        gain.gain.setValueAtTime(0.28, now + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      };

      pulse();
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
      ringTimerRef.current = setInterval(pulse, 800);
    };

    playAudio();
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    start();
    return stop;
  }, [enabled, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { unlock, start, stop, enabled };
}
