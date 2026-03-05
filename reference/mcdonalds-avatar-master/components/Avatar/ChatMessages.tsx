'use client';

import { useEffect, useRef } from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'avatar';
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="absolute left-0 right-0 bottom-24 overflow-y-auto px-4 py-4 space-y-3" style={{ top: '50%', zIndex: 30 }}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
              message.sender === 'user'
                ? 'bg-mcd-yellow text-black rounded-br-sm' // User: McDonald's yellow, right side
                : 'bg-white text-gray-800 rounded-bl-sm' // Avatar: white, left side
            }`}
          >
            {/* Sender label */}
            <div className={`text-xs font-bold mb-1 ${
              message.sender === 'user' ? 'text-mcd-red' : 'text-mcd-red'
            }`}>
              {message.sender === 'user' ? 'You' : 'Casey'}
            </div>

            {/* Message text */}
            <div className="text-sm leading-relaxed break-words">
              {message.text}
            </div>

            {/* Timestamp */}
            <div className={`text-[10px] mt-1 ${
              message.sender === 'user' ? 'text-gray-700' : 'text-gray-500'
            }`}>
              {message.timestamp.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
