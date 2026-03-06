"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface IdleTimeoutOptions {
  onIdle: () => void;
  timeout?: number;
  warningBefore?: number; // Show warning this many ms before timeout
}

export function useIdleTimeout(
  onIdle: () => void,
  timeout: number = 60000,
  warningBefore: number = 15000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    // Set main idle timer
    timerRef.current = setTimeout(onIdle, timeout);
    // Set warning timer
    if (warningBefore > 0 && warningBefore < timeout) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        const totalSecs = Math.ceil(warningBefore / 1000);
        setSecondsLeft(totalSecs);
        // Countdown every second
        let remaining = totalSecs;
        countdownRef.current = setInterval(() => {
          remaining--;
          setSecondsLeft(remaining);
          if (remaining <= 0 && countdownRef.current) {
            clearInterval(countdownRef.current);
          }
        }, 1000);
      }, timeout - warningBefore);
    }
  }, [onIdle, timeout, warningBefore, clearTimers]);

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
      clearTimers();
    };
  }, [reset, clearTimers]);

  return { reset, showWarning, secondsLeft };
}
