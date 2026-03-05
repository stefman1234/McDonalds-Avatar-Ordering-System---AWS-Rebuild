"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import {
  isAvatarReady,
  isVideoReady,
  isListeningNow,
} from "@/lib/klleon/avatar";

export interface DebugEvent {
  id: string;
  timestamp: Date;
  type: "status" | "chat" | "speech" | "error" | "info";
  source: string;
  message: string;
  data?: unknown;
}

// Global debug event store
let debugEvents: DebugEvent[] = [];
let eventSubscribers: ((events: DebugEvent[]) => void)[] = [];

export function addDebugEvent(
  event: Omit<DebugEvent, "id" | "timestamp">
) {
  const newEvent: DebugEvent = {
    ...event,
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
  };

  debugEvents = [newEvent, ...debugEvents].slice(0, 100);
  eventSubscribers.forEach((cb) => cb(debugEvents));
  console.log("[Debug]", newEvent);
}

export function clearDebugEvents() {
  debugEvents = [];
  eventSubscribers.forEach((cb) => cb(debugEvents));
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>(debugEvents);
  const [filter, setFilter] = useState<string>("all");

  const chatMessages = useUIStore((s) => s.chatMessages);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const avatarReady = useUIStore((s) => s.avatarReady);
  const isListening = useUIStore((s) => s.isListening);
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F8") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const callback = (newEvents: DebugEvent[]) => setEvents(newEvents);
    eventSubscribers.push(callback);
    return () => {
      eventSubscribers = eventSubscribers.filter((cb) => cb !== callback);
    };
  }, []);

  if (!open) return null;

  const filteredEvents =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  const getEventColor = (type: DebugEvent["type"]) => {
    switch (type) {
      case "status": return "text-blue-400";
      case "chat": return "text-green-400";
      case "speech": return "text-purple-400";
      case "error": return "text-red-400";
      case "info": return "text-gray-400";
    }
  };

  const getEventIcon = (type: DebugEvent["type"]) => {
    switch (type) {
      case "status": return "📊";
      case "chat": return "💬";
      case "speech": return "🎤";
      case "error": return "❌";
      case "info": return "ℹ️";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-mcdonalds-yellow rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-mcdonalds-red to-mcdonalds-dark-red p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐛</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Debug Panel</h2>
              <p className="text-sm text-white/80">Press F8 to close</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearDebugEvents}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Status Row */}
        <div className="bg-gray-800 p-3 border-b border-gray-700 flex flex-wrap gap-4 text-sm">
          <StatusBadge label="Avatar Init" value={avatarReady} />
          <StatusBadge label="SDK Ready" value={isAvatarReady()} />
          <StatusBadge label="Video" value={isVideoReady()} />
          <StatusBadge label="Listening" value={isListening} />
          <StatusBadge label="SDK Listen" value={isListeningNow()} />
          <StatusBadge label="Processing" value={isProcessing} />
          <span className="text-gray-400 ml-auto">
            Cart: {items.length} items | ${total().toFixed(2)}
          </span>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center gap-2">
          {["all", "status", "chat", "speech", "error", "info"].map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === type
                    ? "bg-mcdonalds-red text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            )
          )}
          <span className="ml-auto text-sm text-gray-400">
            {filteredEvents.length} events
          </span>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-4 font-mono text-sm">
          {filteredEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <span className="text-6xl block mb-4">📭</span>
              <p>No debug events yet</p>
              <p className="text-xs mt-2">
                Events will appear here as they occur
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getEventIcon(event.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-bold ${getEventColor(event.type)}`}
                        >
                          [{event.type.toUpperCase()}]
                        </span>
                        <span className="text-gray-400 text-xs">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-mcdonalds-yellow text-xs">
                          {event.source}
                        </span>
                      </div>
                      <p className="text-gray-300 break-words">
                        {event.message}
                      </p>
                      {event.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                            Show data
                          </summary>
                          <pre className="mt-2 text-xs bg-black/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="bg-gray-800 p-3 border-t border-gray-700 max-h-32 overflow-y-auto">
          <h4 className="text-xs text-gray-400 font-bold mb-1">
            Chat ({chatMessages.length})
          </h4>
          {chatMessages.slice(-5).map((msg) => (
            <div key={msg.id} className="text-xs font-mono">
              <span
                className={
                  msg.role === "user"
                    ? "text-mcdonalds-yellow"
                    : "text-green-400"
                }
              >
                [{msg.role}]
              </span>{" "}
              <span className="text-white/70">{msg.text}</span>
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="bg-gray-800 p-3 border-t border-gray-700 text-xs text-gray-400 rounded-b-lg">
          <div className="flex justify-between">
            <span>Total Events: {events.length}</span>
            <span>
              Errors: {events.filter((e) => e.type === "error").length}
            </span>
            <span>
              Chat: {events.filter((e) => e.type === "chat").length}
            </span>
            <span>
              Speech: {events.filter((e) => e.type === "speech").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className={`w-2 h-2 rounded-full ${value ? "bg-green-400" : "bg-red-400"}`}
      />
      <span className="text-gray-300">{label}</span>
    </span>
  );
}
