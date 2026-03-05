// Global type definitions

// Klleon SDK types
interface Window {
  KlleonChat: {
    init: (config: KlleonConfig) => Promise<void>;
    speak: (text: string) => void;
    onChatEvent: (callback: (data: KlleonChatEvent) => void) => void;
    onStatusEvent: (callback: (status: string) => void) => void;
  };
}

interface KlleonConfig {
  sdk_key: string;
  avatar_id: string;
  subtitle_code?: string;
  enable_speech_input?: boolean;
  enable_speech_output?: boolean;
}

interface KlleonChatEvent {
  type: string;
  text?: string;
  data?: any;
}

// Export empty object to make this a module
export {};
