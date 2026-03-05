"use client";

import { useUIStore } from "@/stores/uiStore";
import { startStt, endStt } from "@/lib/klleon/avatar";

export default function MicButton() {
  const isListening = useUIStore((s) => s.isListening);
  const setListening = useUIStore((s) => s.setListening);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const avatarReady = useUIStore((s) => s.avatarReady);

  function handleToggle() {
    if (isProcessing) return;

    if (isListening) {
      endStt();
      setListening(false);
    } else {
      const started = startStt();
      if (started) {
        setListening(true);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={!avatarReady || isProcessing}
        className={`
          relative group w-20 h-20 rounded-full
          flex items-center justify-center
          transition-all duration-300 transform
          disabled:opacity-40 disabled:pointer-events-none
          ${isListening
            ? "bg-red-500 hover:bg-red-600 scale-110 shadow-2xl shadow-red-500/50"
            : "bg-mcdonalds-red hover:bg-[#C41E3A] hover:scale-105 shadow-xl"
          }
        `}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {/* Mic / Stop icon */}
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isListening ? (
            <rect x="6" y="6" width="12" height="12" strokeWidth={2} fill="currentColor" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          )}
        </svg>

        {/* Listening pulse rings */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
          </>
        )}
      </button>

      {/* Status text */}
      <p className="text-sm font-bold text-white bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full whitespace-nowrap">
        {isListening ? "Listening... Speak now!" : "Press to speak"}
      </p>
    </div>
  );
}
