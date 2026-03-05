"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";

export default function ChatMessages() {
  const messages = useUIStore((s) => s.chatMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show last 6 messages
  const visible = messages.slice(-6);

  return (
    <div
      className="absolute left-0 right-0 bottom-28 overflow-y-auto px-4 py-4 space-y-3 pointer-events-none"
      style={{ top: "50%", zIndex: 30 }}
    >
      {visible.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
              msg.role === "user"
                ? "bg-mcdonalds-yellow text-black rounded-br-sm"
                : "bg-white text-gray-800 rounded-bl-sm"
            }`}
          >
            {/* Sender label */}
            <div className="text-xs font-bold mb-1 text-mcdonalds-red">
              {msg.role === "user" ? "You" : "Casey"}
            </div>

            {/* Message text */}
            <div className="text-sm leading-relaxed break-words">
              {msg.text}
            </div>

            {/* Timestamp */}
            <div
              className={`text-[10px] mt-1 ${
                msg.role === "user" ? "text-gray-700" : "text-gray-500"
              }`}
            >
              {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
