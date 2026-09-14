import { AIProvider, AIProviderStatus } from '../../types/ai';
import { GeminiProvider } from './GeminiProvider';
import { LocalProvider } from './LocalProvider';
import { SnapdragonProvider } from './SnapdragonProvider';
import { OfflineGroundedProvider, offlineGroundedProvider } from './OfflineGroundedProvider';

export class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private activeProviderId: string = 'offline-grounded-provider';

  constructor() {
    this.register(new SnapdragonProvider());
    this.register(new LocalProvider());
    this.register(new GeminiProvider());
    this.register(offlineGroundedProvider);
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregister(providerId: string): boolean {
    return this.providers.delete(providerId);
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(): AIProvider {
    const prov = this.providers.get(this.activeProviderId);
    if (prov) return prov;
    return offlineGroundedProvider;
  }

  setActiveProvider(id: string): void {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
    }
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  async getActiveStatus(): Promise<AIProviderStatus> {
    const active = this.getActiveProvider();
    return active.status();
  }

  async getAllStatuses(): Promise<AIProviderStatus[]> {
    const providers = this.getAllProviders();
    const statuses = await Promise.all(providers.map((p) => p.status()));
    return statuses;
  }

  async getAvailableProvider(): Promise<AIProvider | null> {
    const active = this.getActiveProvider();
    if (await active.isAvailable()) {
      return active;
    }

    for (const provider of this.providers.values()) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    return null;
  }
}

export const aiProviderRegistry = new AIProviderRegistry();
