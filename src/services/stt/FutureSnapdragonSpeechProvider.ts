import {
  SpeechToTextProvider,
  SpeechToTextEvents,
} from '../../types/voice';

/**
 * FutureSnapdragonSpeechProvider
 * Hardware-accelerated on-device speech transcription via Snapdragon NPU
 * (Qualcomm Neural Processing Engine / QNN SDK).
 */
export class FutureSnapdragonSpeechProvider implements SpeechToTextProvider {
  id = 'snapdragon-npu-speech';
  name = 'Snapdragon NPU Voice Engine';
  description = 'Hardware-accelerated on-device neural transcription powered by Snapdragon NPU';

  private listening = false;

  isSupported(): boolean {
    // Snapdragon NPU native hardware binding is not present in standard web runtime
    return false;
  }

  getUnavailabilityReason(): string {
    return 'Snapdragon NPU acceleration drivers (QNN) not detected on this system host.';
  }

  isListening(): boolean {
    return this.listening;
  }

  async start(events: SpeechToTextEvents): Promise<void> {
    events.onError({
      code: 'npu-unavailable',
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
