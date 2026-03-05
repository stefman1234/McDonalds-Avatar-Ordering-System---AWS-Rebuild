'use client';

import { useEffect, useState, useRef } from 'react';
import { initializeKlleon, isKlleonReady } from '@/lib/klleon/init';
import { speak } from '@/lib/klleon/speak';
import { addDebugEvent } from '@/components/Debug';
import { useCartStore } from '@/store/cart';
import { BrowserSTT } from '@/lib/speech/browserSTT';
import { ChatMessages, type ChatMessage } from './ChatMessages';

interface AvatarContainerProps {
  onReady?: () => void;
  onError?: (error: Error) => void;
  onItemAddedToCart?: () => void;
  onItemNotFound?: (filteredItems: any[], query: string, message: string) => void;
}

export function AvatarContainer({ onReady, onError, onItemAddedToCart, onItemNotFound }: AvatarContainerProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Cart store for adding and removing items
  const { addItem, removeItem, updateQuantity, items } = useCartStore();

  // Helper to add a message to the chat (keep last 10 messages for conversation memory)
  const addMessage = (text: string, sender: 'user' | 'avatar') => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // Keep only the last 10 messages for conversation memory
      return updated.slice(-10);
    });
  };

  // Use refs for values that shouldn't trigger effect re-runs
  const hasGreetedRef = useRef(false);
  const isListeningRef = useRef(false);
  const avatarRef = useRef<HTMLElement & { videoStyle?: any; volume?: number }>(null);
  const shouldBlockKlleonLLMRef = useRef(false); // Track when to block Klleon's LLM
  const browserSTTRef = useRef<BrowserSTT | null>(null); // Browser STT instance (bypasses Klleon LLM)

  // Process order with NLP
  const processOrder = async (userText: string) => {
    try {
      addDebugEvent({
        type: 'info',
        source: 'AvatarContainer.processOrder',
        message: `Processing order: "${userText}"`
      });

      // Call NLP API to parse order
      const response = await fetch('/api/nlp/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const { success, data } = await response.json();

      if (!success) {
        throw new Error('Order parsing failed');
      }

      console.log(`[✅ NLP RESULT] Items: ${data.items.length} | Intent: ${data.intent}`);
      addDebugEvent({
        type: 'info',
        source: '✅ NLP RESULT',
        message: `Parsed ${data.items.length} items | Intent: ${data.intent}`,
        data: data
      });

      // Check if item not found - trigger fuzzy match filter
      if (data.itemNotFound && data.filteredItems && data.filteredItems.length > 0) {
        console.log(`[🔍 FUZZY MATCH] Found ${data.filteredItems.length} matches for "${data.filterQuery}"`);
        addDebugEvent({
          type: 'info',
          source: '🔍 FUZZY MATCH',
          message: `Showing ${data.filteredItems.length} matches for "${data.filterQuery}"`
        });

        // Trigger filter mode in parent component
        onItemNotFound?.(data.filteredItems, data.filterQuery, data.filterMessage);

        // Speak the filter message
        console.log(`[🤖 AVATAR RESPONSE] [Fuzzy Match] "${data.response}"`);
        addDebugEvent({
          type: 'speech',
          source: '🤖 AVATAR OUTPUT',
          message: `[Fuzzy Match] "${data.response}"`
        });

        // Add avatar message to chat
        addMessage(data.response, 'avatar');

        await speak(data.response, 'Custom-NLP-Gemini');
        return; // Exit early - don't add items
      }

      // Handle remove intent
      if (data.intent === 'remove' && data.items && data.items.length > 0) {
        data.items.forEach((itemToRemove: any) => {
          // Find cart items matching this name
          const matchingItems = items.filter(cartItem =>
            cartItem.name.toLowerCase() === itemToRemove.name.toLowerCase()
          );

          if (matchingItems.length > 0) {
            // Determine how many to remove (default to 1 if quantity not specified)
            const quantityToRemove = itemToRemove.quantity || 1;

            // Process each matching cart item until we've removed the requested quantity
            let remainingToRemove = quantityToRemove;

            for (const cartItem of matchingItems) {
              if (remainingToRemove <= 0) break;

              if (cartItem.quantity <= remainingToRemove) {
                // Remove entire item if quantity to remove >= item quantity
                removeItem(cartItem.id);
                remainingToRemove -= cartItem.quantity;
                console.log(`[🗑️ CART] Removed entire item: ${cartItem.quantity}x ${cartItem.name}`);
              } else {
                // Decrement quantity if removing less than total
                const newQuantity = cartItem.quantity - remainingToRemove;
                updateQuantity(cartItem.id, newQuantity);
                console.log(`[🗑️ CART] Reduced quantity: ${cartItem.name} from ${cartItem.quantity} to ${newQuantity}`);
                remainingToRemove = 0;
              }
            }

            addDebugEvent({
              type: 'info',
              source: '🗑️ CART',
              message: `Removed: ${quantityToRemove}x ${itemToRemove.name}`
            });
          }
        });
      }

      // Add items to cart
      if (data.intent === 'order' && data.items && data.items.length > 0) {
        data.items.forEach((item: any) => {
          addItem({
            menuItemId: item.menuItemId,
            name: item.name,
            basePrice: item.basePrice,
            quantity: item.quantity,
            selectedSize: item.size ? {
              id: item.size,
              name: item.size.charAt(0).toUpperCase() + item.size.slice(1),
              priceModifier: 0, // TODO: Get actual price modifier from menu
            } : undefined,
            customizations: [],
            isCombo: false,
          });

          console.log(`[🛒 CART] Added: ${item.quantity}x ${item.name}`);
          addDebugEvent({
            type: 'info',
            source: '🛒 CART',
            message: `Added: ${item.quantity}x ${item.name}`
          });
        });

        // Switch to "Your Order" tab
        onItemAddedToCart?.();
      }

      // Speak response generated by Custom NLP
      console.log(`[🤖 AVATAR RESPONSE] [LLM: Custom-NLP-Gemini] "${data.response}"`);
      addDebugEvent({
        type: 'speech',
        source: '🤖 AVATAR OUTPUT',
        message: `[LLM: Custom-NLP-Gemini] "${data.response}"`
      });

      // Add avatar message to chat
      addMessage(data.response, 'avatar');

      await speak(data.response, 'Custom-NLP-Gemini');

      addDebugEvent({
        type: 'speech',
        source: '🤖 AVATAR OUTPUT',
        message: 'Speech completed successfully'
      });

    } catch (error) {
      console.error('[❌ ERROR] Order processing failed:', error);
      addDebugEvent({
        type: 'error',
        source: '❌ ERROR',
        message: `Order processing failed: ${error}`,
        data: error
      });

      // Fallback response
      const fallbackText = "Sorry, I had trouble understanding that. Could you repeat your order?";
      console.log(`[🤖 AVATAR RESPONSE] [LLM: Custom-NLP-Gemini] "${fallbackText}"`);
      addDebugEvent({
        type: 'speech',
        source: '🤖 AVATAR OUTPUT',
        message: `[LLM: Custom-NLP-Gemini] "${fallbackText}"`
      });

      // Add fallback message to chat
      addMessage(fallbackText, 'avatar');

      await speak(fallbackText, 'Custom-NLP-Gemini');
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        addDebugEvent({
          type: 'info',
          source: 'AvatarContainer.init',
          message: 'Starting avatar initialization (following Klleon official pattern)'
        });

        // Per Klleon docs: Set avatar properties via ref BEFORE initialization
        if (avatarRef.current) {
          avatarRef.current.videoStyle = {
            borderRadius: '0px',
            objectFit: 'contain',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            transform: 'scale(0.85)'
          };
          avatarRef.current.volume = 100;
        }

        // Per Klleon docs: Register event handlers BEFORE calling init()
        // Event handlers are registered directly on window.KlleonChat
        // Re-registering replaces the previous handler (per docs)

        const { KlleonChat } = window;

        // 1. Register Status Event Handler
        // CRITICAL: Per docs, status parameter is a STRING, not an object!
        KlleonChat.onStatusEvent((status: string) => {
          console.log('[Avatar] Status:', status);
          addDebugEvent({
            type: 'status',
            source: 'Klleon.onStatusEvent',
            message: `Status: ${status}`,
            data: { status }
          });

          if (status === 'VIDEO_CAN_PLAY' && mounted) {
            setStatus('ready');
            addDebugEvent({
              type: 'status',
              source: 'AvatarContainer.handleStatus',
              message: 'Avatar video ready to play - status set to ready'
            });

            // Greet user when avatar is ready (only once)
            if (!hasGreetedRef.current) {
              hasGreetedRef.current = true;
              addDebugEvent({
                type: 'speech',
                source: 'AvatarContainer.handleStatus',
                message: 'Starting greeting sequence (1000ms delay)'
              });

              setTimeout(async () => {
                try {
                  const greetingText = "Hey! Welcome to McDonald's! I'm Casey, your ordering assistant. Press the microphone button to start ordering!";

                  console.log(`[🤖 AVATAR GREETING] [LLM: Custom-NLP-Gemini] "${greetingText}"`);
                  addDebugEvent({
                    type: 'speech',
                    source: '🤖 AVATAR OUTPUT',
                    message: `[LLM: Custom-NLP-Gemini] Greeting: "${greetingText}"`
                  });

                  await speak(greetingText, 'Custom-NLP-Gemini');

                  console.log('[Avatar] Greeting completed');
                  addDebugEvent({
                    type: 'speech',
                    source: '🤖 AVATAR OUTPUT',
                    message: 'Greeting completed successfully'
                  });
                } catch (error) {
                  console.error('[❌ ERROR] Greeting failed:', error);
                  addDebugEvent({
                    type: 'error',
                    source: '❌ ERROR',
                    message: `Greeting failed: ${error}`,
                    data: error
                  });
                }
              }, 1000);
            } else {
              addDebugEvent({
                type: 'info',
                source: 'AvatarContainer.handleStatus',
                message: 'Greeting skipped - already greeted'
              });
            }

            onReady?.();
          }
        });

        // 2. Register Chat Event Handler
        // NOTE: We use Browser STT (not Klleon STT), so we won't receive STT_RESULT events
        // This handler is only for monitoring Klleon's internal events (if any)
        KlleonChat.onChatEvent((event: any) => {
          console.log('[Klleon] Chat event:', event);
          addDebugEvent({
            type: 'chat',
            source: 'Klleon.onChatEvent',
            message: `Event: ${event.chat_type}`,
            data: event
          });

          // NOTE: No STT handling here - we use Browser STT which bypasses Klleon's LLM
        });

        // 3. Initialize SDK (after event handlers are registered)
        addDebugEvent({
          type: 'info',
          source: 'AvatarContainer.init',
          message: 'Calling initializeKlleon() - SDK will prevent duplicate init internally'
        });

        await initializeKlleon();

        addDebugEvent({
          type: 'status',
          source: 'AvatarContainer.init',
          message: 'Klleon initialization completed'
        });

        if (!mounted) return;

      } catch (error) {
        console.error('[Avatar] Initialization error:', error);
        addDebugEvent({
          type: 'error',
          source: 'AvatarContainer.init',
          message: `Initialization failed: ${error}`,
          data: error
        });

        if (!mounted) return;

        const errorMsg = error instanceof Error ? error.message : 'Failed to initialize avatar';
        setErrorMessage(errorMsg);
        setStatus('error');
        onError?.(error instanceof Error ? error : new Error(errorMsg));
      }
    };

    init();

    return () => {
      mounted = false;
      // Cleanup: destroy avatar instance
      if (isKlleonReady() && window.KlleonChat) {
        try {
          console.log('[Avatar] Cleaning up avatar instance...');
          window.KlleonChat.destroy();
        } catch (error) {
          console.error('[Avatar] Cleanup error:', error);
        }
      }
    };
  }, []); // ← EMPTY dependency array per Klleon docs - only run once!

  // Toggle microphone listening (push-to-talk)
  // USING BROWSER STT - Bypasses Klleon's LLM completely!
  const toggleMicrophone = async () => {
    // Check microphone availability first
    const micCheck = await BrowserSTT.checkMicrophoneAvailability();

    if (!micCheck.available) {
      console.error('[Microphone] Not available:', micCheck.error);
      addDebugEvent({
        type: 'error',
        source: 'Microphone Check',
        message: micCheck.error || 'Microphone not available'
      });

      // Show alert to user
      alert(`Microphone Error:\n\n${micCheck.error}\n\nPlease:\n1. Check Windows microphone privacy settings\n2. Ensure a microphone is connected\n3. Close other apps using the microphone\n4. Refresh the page after fixing`);
      return;
    }

    // Initialize Browser STT if not already done
    if (!browserSTTRef.current) {
      try {
        browserSTTRef.current = new BrowserSTT();
        console.log('[Browser STT] Initialized successfully');
        addDebugEvent({
          type: 'info',
          source: 'Browser STT',
          message: 'Initialized - Using native browser speech recognition (bypasses Klleon LLM)'
        });
      } catch (error) {
        console.error('[Browser STT] Initialization failed:', error);
        addDebugEvent({
          type: 'error',
          source: 'Browser STT',
          message: `Failed to initialize: ${error}`,
          data: error
        });
        alert(`Speech Recognition Error:\n\n${error}\n\nPlease refresh the page and try again.`);
        return;
      }
    }

    try {
      if (isListening) {
        // Stop listening
        console.log('[Browser STT] Stopping...');
        addDebugEvent({
          type: 'info',
          source: 'Browser STT',
          message: 'User stopped speaking - processing...'
        });
        browserSTTRef.current.stop();
        isListeningRef.current = false;
        setIsListening(false);
      } else {
        // Start listening
        console.log('[Browser STT] Starting...');
        addDebugEvent({
          type: 'info',
          source: 'Browser STT',
          message: 'Listening for user speech...'
        });

        browserSTTRef.current.start(
          // On successful speech recognition
          (text: string) => {
            console.log(`[👤 USER INPUT] "${text}"`);
            addDebugEvent({
              type: 'speech',
              source: '👤 USER INPUT',
              message: `"${text}"`
            });

            // Add user message to chat
            addMessage(text, 'user');

            // Stop listening
            isListeningRef.current = false;
            setIsListening(false);

            // Process order with custom NLP (NO Klleon LLM involved!)
            console.log('[🧠 NLP PROCESSING] Sending to Google Gemini for order parsing...');
            addDebugEvent({
              type: 'info',
              source: '🧠 NLP PROCESSING',
              message: 'Processing with Google Gemini 1.5 Flash (Klleon LLM never contacted!)'
            });

            processOrder(text);
          },
          // On error
          (error: Error) => {
            console.error('[Browser STT] Recognition error:', error);
            addDebugEvent({
              type: 'error',
              source: 'Browser STT',
              message: `Speech recognition failed: ${error.message}`,
              data: error
            });
            isListeningRef.current = false;
            setIsListening(false);
          }
        );

        isListeningRef.current = true;
        setIsListening(true);
      }
    } catch (error) {
      console.error('[Browser STT] Toggle error:', error);
      addDebugEvent({
        type: 'error',
        source: 'Browser STT',
        message: `Microphone toggle failed: ${error}`,
        data: error
      });
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  // CRITICAL: Always render avatar-container element, even while loading
  // SDK needs the element to exist in DOM when init() is called
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      {/* Klleon avatar custom element - MUST be in DOM before SDK init */}
      {/* Per docs: videoStyle and volume are set via ref, not JSX props */}
      <avatar-container
        ref={avatarRef}
        className="w-full h-full"
        style={{ zIndex: 10 }}
      />

      {/* Chat Messages Overlay - WhatsApp style with McDonald's theme */}
      {status === 'ready' && (
        <ChatMessages messages={messages} />
      )}

      {/* Loading Overlay - shown while status is 'loading' */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-mcd-red/80 to-mcd-dark-red/80 backdrop-blur-sm" style={{ zIndex: 20 }}>
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border-4 border-white/30 animate-pulse">
              <div className="w-20 h-20 border-4 border-white border-t-mcd-yellow rounded-full animate-spin" />
            </div>
            <p className="text-white text-lg font-medium">Loading Casey...</p>
            <p className="text-white/80 text-sm mt-1">Preparing your ordering assistant</p>
          </div>
        </div>
      )}

      {/* Error Overlay - shown if avatar fails to load */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm" style={{ zIndex: 20 }}>
          <div className="text-center max-w-md px-6">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border-4 border-white/30 mx-auto">
              <span className="text-6xl">⚠️</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Avatar Unavailable</h3>
            <p className="text-white/90 text-sm mb-4">{errorMessage || 'Failed to load avatar'}</p>
            <p className="text-white/80 text-xs">
              You can still browse and order from the menu below
            </p>
          </div>
        </div>
      )}

      {/* Microphone Button - Push to Talk */}
      {status === 'ready' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={toggleMicrophone}
            className={`
              relative group
              w-24 h-24 rounded-full
              flex items-center justify-center
              transition-all duration-300 transform
              ${isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse shadow-2xl shadow-red-500/50'
                : 'bg-mcd-red hover:bg-mcd-dark-red hover:scale-105 shadow-xl'
              }
            `}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {/* Microphone Icon */}
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isListening ? (
                // Stop icon when listening
                <rect x="6" y="6" width="12" height="12" strokeWidth={2} fill="currentColor" />
              ) : (
                // Microphone icon when not listening
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </>
              )}
            </svg>

            {/* Listening indicator rings */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></span>
              </>
            )}
          </button>

          {/* Status text */}
          <div className="mt-3 text-center">
            <p className="text-sm font-bold text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
              {isListening ? '🔴 Listening... Speak now!' : '🎤 Press to speak'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
