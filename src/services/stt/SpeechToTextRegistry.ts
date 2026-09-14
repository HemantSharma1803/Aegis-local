import { SpeechToTextProvider } from '../../types/voice';
import { BrowserSpeechProvider } from './BrowserSpeechProvider';
import { LocalSpeechProvider } from './LocalSpeechProvider';
import { FutureSnapdragonSpeechProvider } from './FutureSnapdragonSpeechProvider';

export class SpeechToTextRegistry {
  private providers: SpeechToTextProvider[] = [];
  private activeProviderId: string = 'browser-speech';

  constructor() {
    this.providers = [
      new BrowserSpeechProvider(),
      new LocalSpeechProvider(),
      new FutureSnapdragonSpeechProvider(),
    ];
  }

  getProviders(): SpeechToTextProvider[] {
    return this.providers;
  }

  getActiveProvider(): SpeechToTextProvider {
    const found = this.providers.find((p) => p.id === this.activeProviderId);
    if (found) return found;
    return this.providers[0];
  }

  setActiveProvider(providerId: string): boolean {
    const exists = this.providers.some((p) => p.id === providerId);
    if (exists) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  getBestAvailableProvider(): {
    provider: SpeechToTextProvider;
    isSupported: boolean;
    unavailabilityReason?: string;
  } {
    const browserProvider = this.providers.find((p) => p.id === 'browser-speech')!;
    if (browserProvider.isSupported()) {
      return {
        provider: browserProvider,
        isSupported: true,
      };
    }

    return {
      provider: browserProvider,
      isSupported: false,
      unavailabilityReason: browserProvider.getUnavailabilityReason
        ? browserProvider.getUnavailabilityReason()
        : 'Speech recognition is not supported in this environment.',
    };
  }
}

export const speechToTextRegistry = new SpeechToTextRegistry();
