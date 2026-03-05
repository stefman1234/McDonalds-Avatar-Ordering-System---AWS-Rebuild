'use client';

import { useEffect, useState } from 'react';

export interface DebugEvent {
  id: string;
  timestamp: Date;
  type: 'status' | 'chat' | 'speech' | 'error' | 'info';
  source: string;
  message: string;
  data?: any;
}

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Global debug event store
let debugEvents: DebugEvent[] = [];
let eventSubscribers: ((events: DebugEvent[]) => void)[] = [];

export function addDebugEvent(event: Omit<DebugEvent, 'id' | 'timestamp'>) {
  const newEvent: DebugEvent = {
    ...event,
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
  };

  debugEvents = [newEvent, ...debugEvents].slice(0, 100); // Keep last 100 events
  eventSubscribers.forEach(callback => callback(debugEvents));

  console.log('[Debug]', newEvent);
}

export function clearDebugEvents() {
  debugEvents = [];
  eventSubscribers.forEach(callback => callback(debugEvents));
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [events, setEvents] = useState<DebugEvent[]>(debugEvents);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Subscribe to debug events
    const callback = (newEvents: DebugEvent[]) => {
      setEvents(newEvents);
    };
    eventSubscribers.push(callback);

    return () => {
      eventSubscribers = eventSubscribers.filter(cb => cb !== callback);
    };
  }, []);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.type === filter);

  const getEventColor = (type: DebugEvent['type']) => {
    switch (type) {
      case 'status': return 'text-blue-400';
      case 'chat': return 'text-green-400';
      case 'speech': return 'text-purple-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getEventIcon = (type: DebugEvent['type']) => {
    switch (type) {
      case 'status': return '📊';
      case 'chat': return '💬';
      case 'speech': return '🎤';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-mcd-yellow rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-mcd-red to-mcd-dark-red p-4 rounded-t-lg flex items-center justify-between">
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
              onClick={onClose}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center gap-2">
          {['all', 'status', 'chat', 'speech', 'error', 'info'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-mcd-red text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
            <span className="text-sm text-gray-400">
              {filteredEvents.length} events
            </span>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-4 font-mono text-sm">
          {filteredEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <span className="text-6xl block mb-4">📭</span>
              <p>No debug events yet</p>
              <p className="text-xs mt-2">Events will appear here as they occur</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getEventIcon(event.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${getEventColor(event.type)}`}>
                          [{event.type.toUpperCase()}]
                        </span>
                        <span className="text-gray-400 text-xs">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-mcd-yellow text-xs">
                          {event.source}
                        </span>
                      </div>
                      <p className="text-gray-300 break-words">{event.message}</p>
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

        {/* Footer Stats */}
        <div className="bg-gray-800 p-3 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Total Events: {events.length}</span>
            <span>Errors: {events.filter(e => e.type === 'error').length}</span>
            <span>Chat Events: {events.filter(e => e.type === 'chat').length}</span>
            <span>Speech Events: {events.filter(e => e.type === 'speech').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
