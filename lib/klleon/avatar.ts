/* eslint-disable @typescript-eslint/no-explicit-any */

// Type declarations matching Klleon SDK v1.2.0 (from official docs)
interface KlleonInitOptions {
  sdk_key: string;
  avatar_id: string;
  subtitle_code?: string;
  voice_code?: string;
  voice_tts_speech_speed?: number;
  enable_microphone?: boolean;
  log_level?: "debug" | "info" | "warn" | "error" | "silent";
  custom_id?: string;
  user_key?: string;
}

interface KlleonChatData {
  chat_type: string;
  message?: string;
}

interface KlleonSDK {
  init(options: KlleonInitOptions): Promise<void>;
  destroy(): void;
  echo(text: string): void;
  sendTextMessage(text: string): void;
  startStt(): void;
  endStt(): void;
  cancelStt(): void;
  stopSpeech(): void;
  onStatusEvent(callback: (status: string) => void): void;
  onChatEvent(callback: (data: KlleonChatData) => void): void;
  clearMessageList(): void;
  changeAvatar(option: any): void;
}

declare global {
  interface Window {
    KlleonChat: KlleonSDK;
  }
}

type STTCallback = (transcript: string) => void;
type VideoReadyCallback = () => void;

let sttCallback: STTCallback | null = null;
let videoReadyCallback: VideoReadyCallback | null = null;
let avatarInitialized = false;
let videoReady = false;
let currentlyListening = false;
// When true, we block Klleon's built-in LLM responses (TEXT, PREPARING_RESPONSE)
// because we use our own NLP pipeline via echo()
let blockKlleonLLM = false;

function log(level: "info" | "warn" | "error", ...args: any[]) {
  const prefix = `[Klleon ${new Date().toISOString().slice(11, 23)}]`;
  if (level === "error") console.error(prefix, ...args);
  else if (level === "warn") console.warn(prefix, ...args);
  else console.log(prefix, ...args);
}

async function waitForSDK(timeout = 15000): Promise<void> {
  const start = Date.now();
  log("info", "Waiting for window.KlleonChat global...");

  while (!window.KlleonChat) {
    if (Date.now() - start > timeout) {
      log("error", `SDK not found after ${timeout}ms. window.KlleonChat =`, window.KlleonChat);
      const klleonKeys = Object.keys(window).filter(
        (k) => k.toLowerCase().includes("klleon")
      );
      log("error", "Window keys containing 'klleon':", klleonKeys);
      throw new Error(`Klleon SDK failed to load within ${timeout}ms`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  log("info", "window.KlleonChat found! Type:", typeof window.KlleonChat);
  try {
    const methods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(window.KlleonChat)
    );
    log("info", "KlleonChat methods:", methods);
  } catch {
    log("info", "KlleonChat keys:", Object.keys(window.KlleonChat));
  }
}

export async function initAvatar(): Promise<void> {
  if (avatarInitialized) {
    log("warn", "Already initialized — SDK handles duplicate prevention");
    return;
  }

  if (typeof window === "undefined") {
    throw new Error("Cannot init Klleon: window is undefined (SSR)");
  }

  const sdkKey = process.env.NEXT_PUBLIC_KLLEON_SDK_KEY;
  const avatarId = process.env.NEXT_PUBLIC_KLLEON_AVATAR_ID;

  log("info", "--- INIT START ---");
  log("info", "SDK Key present:", !!sdkKey, sdkKey ? `(${sdkKey.slice(0, 12)}...)` : "MISSING");
  log("info", "Avatar ID present:", !!avatarId, avatarId ? `(${avatarId.slice(0, 12)}...)` : "MISSING");

  if (!sdkKey || !avatarId) {
    throw new Error("Klleon SDK key or Avatar ID not in env");
  }

  try {
    await waitForSDK();

    const { KlleonChat } = window;

    // Per Klleon docs: register event handlers BEFORE calling init()

    // 1. Status event handler — callback receives a PLAIN STRING
    KlleonChat.onStatusEvent((status: string) => {
      log("info", "onStatusEvent:", status);
      if (status === "VIDEO_CAN_PLAY") {
        if (!videoReady) {
          videoReady = true;
          log("info", "VIDEO_CAN_PLAY — avatar video is ready!");
          videoReadyCallback?.();
        }
      }
    });

    // 2. Chat event handler — intercept STT_RESULT for our NLP pipeline
    //    CRITICAL: After endStt(), Klleon sends transcript to its built-in LLM.
    //    We must stopSpeech() immediately to kill Klleon's LLM response,
    //    then use our own NLP + echo() for the avatar to speak our response.
    KlleonChat.onChatEvent((data: KlleonChatData) => {
      log("info", "onChatEvent:", JSON.stringify(data));
      const chatType = data.chat_type;
      const message = data.message;

      // STT_RESULT is fired after endStt() converts speech to text
      if (chatType === "STT_RESULT" && message) {
        log("info", "STT transcript:", message);
        // IMMEDIATELY block Klleon's LLM from speaking its own response
        blockKlleonLLM = true;
        KlleonChat.stopSpeech();
        log("info", "Blocked Klleon LLM — using our own NLP pipeline");
        if (sttCallback) {
          sttCallback(message);
        }
        return;
      }

      // Block Klleon's LLM responses — we handle responses via echo()
      if (blockKlleonLLM && (chatType === "PREPARING_RESPONSE" || chatType === "TEXT")) {
        log("info", `Blocking Klleon LLM event: ${chatType}`);
        KlleonChat.stopSpeech();
        return;
      }

      // Reset block flag when Klleon's LLM response cycle ends
      if (chatType === "RESPONSE_IS_ENDED") {
        blockKlleonLLM = false;
        log("info", "Klleon LLM response cycle ended, block reset");
      }
    });

    log("info", "Event handlers registered BEFORE init");

    // 3. Now call init() — enable_microphone: true for Klleon STT
    const options: KlleonInitOptions = {
      sdk_key: sdkKey,
      avatar_id: avatarId,
      log_level: "info",
      enable_microphone: true,
      voice_code: "en_us",
      subtitle_code: "en_us",
    };

    log("info", "Calling KlleonChat.init()...");
    await KlleonChat.init(options);
    log("info", "KlleonChat.init() completed!");

    avatarInitialized = true;

    log("info", "--- INIT COMPLETE --- (waiting for VIDEO_CAN_PLAY)");
  } catch (error) {
    log("error", "--- INIT FAILED ---", error);
    throw error;
  }
}

export function isAvatarReady(): boolean {
  return avatarInitialized && typeof window !== "undefined" && !!window.KlleonChat;
}

export function isVideoReady(): boolean {
  return videoReady;
}

export function speak(text: string): void {
  if (!isAvatarReady()) {
    log("warn", "speak() called but avatar not initialized — dropping");
    return;
  }
  log("info", `echo(): "${text.slice(0, 100)}${text.length > 100 ? "..." : ""}" (videoReady=${videoReady})`);
  try {
    const result: any = window.KlleonChat.echo(text);
    if (result && typeof result.catch === "function") {
      result.catch((err: any) => {
        log("error", "echo() promise rejected:", err);
      });
    }
  } catch (err) {
    log("error", "echo() threw:", err);
  }
}

export function stopSpeech(): void {
  if (!isAvatarReady()) return;
  log("info", "stopSpeech()");
  window.KlleonChat.stopSpeech();
}

// Klleon STT: startStt() begins microphone recording
export function startStt(): boolean {
  if (!isAvatarReady() || !videoReady) {
    log("warn", "startStt() called but avatar not ready");
    return false;
  }
  try {
    window.KlleonChat.startStt();
    currentlyListening = true;
    log("info", "startStt() — recording started");
    return true;
  } catch (err) {
    log("error", "startStt() failed:", err);
    currentlyListening = false;
    return false;
  }
}

// Klleon STT: endStt() stops recording and sends audio for transcription
// Result arrives via onChatEvent with chat_type "STT_RESULT"
export function endStt(): void {
  if (!isAvatarReady()) return;
  try {
    window.KlleonChat.endStt();
    currentlyListening = false;
    log("info", "endStt() — recording stopped, awaiting STT_RESULT");
  } catch (err) {
    log("error", "endStt() failed:", err);
    currentlyListening = false;
  }
}

// Klleon STT: cancelStt() cancels without sending
export function cancelStt(): void {
  if (!isAvatarReady()) return;
  try {
    window.KlleonChat.cancelStt();
    currentlyListening = false;
    log("info", "cancelStt() — recording cancelled");
  } catch (err) {
    log("error", "cancelStt() failed:", err);
    currentlyListening = false;
  }
}

export function isListeningNow(): boolean {
  return currentlyListening;
}

export function onSTT(callback: STTCallback): void {
  sttCallback = callback;
  log("info", "STT callback registered");
}

export function onVideoReady(callback: VideoReadyCallback): void {
  videoReadyCallback = callback;
  if (videoReady) {
    log("info", "onVideoReady — already ready, firing immediately");
    callback();
  } else {
    log("info", "onVideoReady — registered, waiting for VIDEO_CAN_PLAY");
  }
}

export function destroyAvatar(): void {
  if (typeof window !== "undefined" && window.KlleonChat) {
    log("info", "Destroying avatar instance");
    window.KlleonChat.destroy();
    avatarInitialized = false;
    videoReady = false;
    currentlyListening = false;
  }
}
