import { getKlleonInstance, isKlleonReady } from './init';
import { KlleonChatEvent, KlleonStatusEvent } from '@/types/klleon';

export type ChatEventHandler = (event: KlleonChatEvent) => void;
export type StatusEventHandler = (event: KlleonStatusEvent) => void;

/**
 * Set up event listener for user speech (STT) and avatar responses
 *
 * @param handler - Callback function to handle chat events
 */
export function onChatEvent(handler: ChatEventHandler): void {
  if (!isKlleonReady()) {
    console.warn('[Klleon] Cannot set up chat listener: Avatar not ready');
    return;
  }

  try {
    const klleon = getKlleonInstance();
    klleon.onChatEvent((event) => {
      console.log('[Klleon] Chat event:', event);
      handler(event);
    });
  } catch (error) {
    console.error('[Klleon] Error setting up chat listener:', error);
  }
}

/**
 * Set up event listener for avatar status changes
 *
 * @param handler - Callback function to handle status events
 */
export function onStatusEvent(handler: StatusEventHandler): void {
  if (!isKlleonReady()) {
    console.warn('[Klleon] Cannot set up status listener: Avatar not ready');
    return;
  }

  try {
    const klleon = getKlleonInstance();
    klleon.onStatusEvent((event) => {
      console.log('[Klleon] Status event:', event);
      handler(event);
    });
  } catch (error) {
    console.error('[Klleon] Error setting up status listener:', error);
  }
}

/**
 * Start listening for user speech
 */
export async function startListening(): Promise<void> {
  if (!isKlleonReady()) {
    throw new Error('Avatar not ready');
  }

  try {
    const klleon = getKlleonInstance();
    await klleon.startListening();
    console.log('[Klleon] Started listening for user speech');
  } catch (error) {
    console.error('[Klleon] Error starting listening:', error);
    throw error;
  }
}

/**
 * Stop listening for user speech
 */
export function stopListening(): void {
  if (!isKlleonReady()) {
    return;
  }

  try {
    const klleon = getKlleonInstance();
    klleon.stopListening();
    console.log('[Klleon] Stopped listening for user speech');
  } catch (error) {
    console.error('[Klleon] Error stopping listening:', error);
  }
}

/**
 * Get current avatar status
 */
export function getAvatarStatus(): KlleonStatusEvent['status'] | null {
  if (!isKlleonReady()) {
    return null;
  }

  try {
    const klleon = getKlleonInstance();
    return klleon.getStatus();
  } catch (error) {
    console.error('[Klleon] Error getting status:', error);
    return null;
  }
}
