"use client";

import { useState, useRef, useEffect } from "react";

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextInput({ onSubmit, disabled, placeholder }: TextInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/50">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder ?? "Type your order..."}
        disabled={disabled}
        className="flex-1 bg-transparent text-gray-900 text-sm placeholder-gray-500 outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-mcdonalds-red text-white disabled:opacity-40 hover:bg-[#C41E3A] transition-colors flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
