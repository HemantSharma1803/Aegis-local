import {
  SpeechToTextProvider,
  SpeechToTextEvents,
} from '../../types/voice';

/**
 * LocalSpeechProvider
 * Represents a local on-device transcription engine (e.g. Whisper.wasm / Vosk)
 * when packaged in on-device runtime environments.
 */
export class LocalSpeechProvider implements SpeechToTextProvider {
  id = 'local-speech';
  name = 'Local On-Device Engine (WASM/Vosk)';
  description = 'Embedded offline transcription model for zero-network speech processing';

  private listening = false;

  isSupported(): boolean {
    // In this web environment, offline WASM whisper binary is not bundled by default.
    return false;
  }

  getUnavailabilityReason(): string {
    return 'Local WASM transcription model bundle is not loaded in this browser container. Using native browser speech or manual response.';
  }

  isListening(): boolean {
    return this.listening;
  }

  async start(events: SpeechToTextEvents): Promise<void> {
    events.onError({
      code: 'model-not-loaded',
      message: this.getUnavailabilityReason(),
    });
    throw new Error(this.getUnavailabilityReason());
  }

  async stop(): Promise<void> {
    this.listening = false;
  }

  abort(): void {
    this.listening = false;
  }
}
