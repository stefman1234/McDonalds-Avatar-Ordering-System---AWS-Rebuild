/**
 * Klleon SDK Type Definitions
 * Version: 2.0.0
 *
 * Klleon provides built-in Speech-to-Text (STT), Text-to-Speech (TTS),
 * and automatic lip-sync for avatar rendering.
 */

export interface KlleonInitOptions {
  sdk_key: string;
  avatar_id: string;
  subtitle_code?: string; // Language for subtitles (default: ko_kr)
  voice_code?: string; // Speech language setting
  voice_tts_speech_speed?: number; // Speech speed (0.5-2.0, default: 1.0)
  enable_microphone?: boolean; // Voice input (default: true)
  log_level?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  custom_id?: string; // Custom device identifier
  user_key?: string; // User session management key
}

export interface KlleonChatEvent {
  type: 'user_speech' | 'avatar_speech' | 'system';
  text: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface KlleonStatusEvent {
  status: 'loading' | 'ready' | 'speaking' | 'listening' | 'error' | 'idle' | 'VIDEO_CAN_PLAY';
  message?: string;
  error?: string;
}

export interface KlleonSpeakOptions {
  text: string;
  interrupt?: boolean;
  voice?: string;
  speed?: number;
}

export interface KlleonChat {
  /**
   * Initialize the Klleon SDK with avatar configuration
   */
  init(options: KlleonInitOptions): Promise<void>;

  /**
   * Make the avatar speak text with automatic lip-sync
   */
  speak(text: string | KlleonSpeakOptions): Promise<void>;

  /**
   * Listen for chat events (user speech, avatar speech, etc.)
   */
  onChatEvent(callback: (event: KlleonChatEvent) => void): void;

  /**
   * Listen for status updates (loading, ready, speaking, etc.)
   */
  onStatusEvent(callback: (event: KlleonStatusEvent) => void): void;

  /**
   * Start listening for user speech
   */
  startListening(): Promise<void>;

  /**
   * Stop listening for user speech
   */
  stopListening(): void;

  /**
   * Destroy the avatar instance
   */
  destroy(): void;

  /**
   * Get current status
   */
  getStatus(): KlleonStatusEvent['status'];
}

declare global {
  interface Window {
    KlleonChat: KlleonChat;
  }

  namespace JSX {
    interface IntrinsicElements {
      'avatar-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.Ref<HTMLElement>;
        style?: any;
      };
      'chat-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.Ref<HTMLElement>;
        style?: any;
      };
    }
  }
}

export {};
