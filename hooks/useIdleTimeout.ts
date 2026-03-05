"use client";

import { useEffect, useRef, useCallback } from "react";

export function useIdleTimeout(
  onIdle: () => void,
  timeout: number = 30000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onIdle, timeout);
  }, [onIdle, timeout]);

  useEffect(() => {
    const events = ["mousedown", "touchstart", "keydown", "scroll"];
    const handler = () => reset();

    for (const event of events) {
      window.addEventListener(event, handler, { passive: true });
    }
    reset();

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handler);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset]);

  return reset;
}
