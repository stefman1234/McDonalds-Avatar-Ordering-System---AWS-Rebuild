/**
 * Browser-based Speech-to-Text using Web Speech API
 * This bypasses Klleon's STT to avoid triggering their LLM
 */

export class BrowserSTT {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback?: (text: string) => void;
  private onErrorCallback?: (error: Error) => void;

  /**
   * Check if microphone is available
   */
  static async checkMicrophoneAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      // Check if browser supports Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        return {
          available: false,
          error: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
        };
      }

      // Check if microphone permission is granted
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop the stream immediately after checking
          stream.getTracks().forEach(track => track.stop());
          return { available: true };
        } catch (error: any) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            return {
              available: false,
              error: 'Microphone permission denied. Please allow microphone access in your browser settings.'
            };
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            return {
              available: false,
              error: 'No microphone found. Please connect a microphone and try again.'
            };
          } else {
            return {
              available: false,
              error: `Microphone error: ${error.message}`
            };
          }
        }
      } else {
        return {
          available: false,
          error: 'MediaDevices API not supported in this browser.'
        };
      }
    } catch (error: any) {
      return {
        available: false,
        error: `Failed to check microphone: ${error.message}`
      };
    }
  }

  constructor() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Web Speech API not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; // Keep listening until manually stopped
    this.recognition.interimResults = true; // Show interim results for better UX
    this.recognition.lang = 'en-US'; // English

    // Set up event handlers
    this.recognition.onresult = (event: any) => {
      // Get the latest result (only process final results)
      const lastResultIndex = event.results.length - 1;
      const lastResult = event.results[lastResultIndex];

      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        console.log('[Browser STT] Recognized (final):', transcript);

        if (this.onResultCallback) {
          this.onResultCallback(transcript);
        }
      } else {
        // Interim result - just log it
        const transcript = lastResult[0].transcript;
        console.log('[Browser STT] Interim:', transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('[Browser STT] Error:', event.error);

      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    this.recognition.onend = () => {
      console.log('[Browser STT] Recognition ended');
      this.isListening = false;
    };
  }

  /**
   * Start listening for speech
   */
  start(onResult: (text: string) => void, onError?: (error: Error) => void): void {
    if (this.isListening) {
      console.warn('[Browser STT] Already listening');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('[Browser STT] Started listening');
    } catch (error) {
      console.error('[Browser STT] Failed to start:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
    }
  }

  /**
   * Stop listening for speech
   */
  stop(): void {
    if (!this.isListening) {
      console.warn('[Browser STT] Not listening');
      return;
    }

    try {
      this.recognition.stop();
      this.isListening = false;
      console.log('[Browser STT] Stopped listening');
    } catch (error) {
      console.error('[Browser STT] Failed to stop:', error);
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }
}
