// Klleon SDK initialization utilities

/**
 * Wait for Klleon SDK to be loaded
 * Polls for window.KlleonChat with timeout
 */
async function waitForKlleonSDK(timeout = 10000): Promise<void> {
  const startTime = Date.now();

  while (!window.KlleonChat) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Klleon SDK failed to load. Please refresh the page.');
    }
    // Wait 100ms before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('[Klleon] SDK loaded successfully');
}

/**
 * Initialize Klleon Avatar SDK
 * This function sets up the avatar with built-in STT/TTS capabilities
 *
 * Per Klleon docs: SDK has internal duplicate initialization prevention
 * Multiple calls to init() will only initialize once
 */
export async function initializeKlleon(): Promise<void> {
  // Wait for KlleonChat to be available
  if (typeof window === 'undefined') {
    throw new Error('Cannot initialize Klleon: window is undefined');
  }

  try {
    // Wait for the script to load (up to 10 seconds)
    await waitForKlleonSDK();

    const options = {
      sdk_key: process.env.NEXT_PUBLIC_KLLEON_SDK_KEY || '',
      avatar_id: process.env.NEXT_PUBLIC_KLLEON_AVATAR_ID || '',
      log_level: 'info' as const, // Set to 'silent' in production
      enable_microphone: false, // Disabled - using BrowserSTT instead to avoid SDK bug
      voice_code: 'en_us', // English voice for TTS
      subtitle_code: 'en_us', // English subtitles
    };

    // Validate required credentials
    if (!options.sdk_key || !options.avatar_id) {
      throw new Error('Klleon credentials missing in environment variables');
    }

    console.log('[Klleon] Calling init() - SDK handles duplicate prevention internally');

    // Per Klleon docs: SDK prevents duplicate initialization internally
    // Safe to call multiple times, only first call will actually initialize
    await window.KlleonChat.init(options);

    console.log('[Klleon] SDK init() completed');
  } catch (error) {
    console.error('[Klleon] Initialization failed:', error);
    throw error;
  }
}

/**
 * Check if Klleon is ready
 */
export function isKlleonReady(): boolean {
  return typeof window !== 'undefined' && !!window.KlleonChat;
}

/**
 * Get Klleon instance
 */
export function getKlleonInstance() {
  if (!isKlleonReady()) {
    throw new Error('KlleonChat not available');
  }
  return window.KlleonChat;
}
