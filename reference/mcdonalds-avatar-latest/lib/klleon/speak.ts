import { getKlleonInstance, isKlleonReady } from './init';

/**
 * Make the avatar speak text with automatic lip-sync
 * Uses Klleon's built-in Text-to-Speech (TTS)
 * Per Klleon docs: Use echo() method to make avatar speak without LLM processing
 *
 * @param text - The text for the avatar to speak
 * @param llmSource - Which LLM generated this response (for debug tracking)
 */
export async function speak(text: string, llmSource: 'Custom-NLP-Gemini' | 'Klleon-LLM' = 'Custom-NLP-Gemini'): Promise<void> {
  if (!isKlleonReady()) {
    console.warn('[Klleon] Cannot speak: Avatar not ready');
    return;
  }

  try {
    const klleon = getKlleonInstance();

    console.log(`[🤖 AVATAR OUTPUT] [Source: ${llmSource}] "${text}"`);

    // Per Klleon docs: echo() makes the avatar speak the text directly (TTS only)
    // This is different from sendTextMessage() which sends to LLM for processing
    await klleon.echo(text);

    console.log('[Klleon] Speaking completed');
  } catch (error) {
    console.error('[Klleon] Speak error:', error);
    throw error;
  }
}

/**
 * Stop current avatar speech
 * Uses Klleon's stopSpeech() method
 */
export function stopSpeech(): void {
  if (!isKlleonReady()) {
    console.warn('[Klleon] Cannot stop speech: Avatar not ready');
    return;
  }

  try {
    const klleon = getKlleonInstance();
    klleon.stopSpeech();
    console.log('[Klleon] Speech stopped');
  } catch (error) {
    console.error('[Klleon] Stop speech error:', error);
  }
}
