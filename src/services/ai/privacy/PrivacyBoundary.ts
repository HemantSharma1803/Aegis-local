import { AIProcessingLocation, AIProvider, AIProviderStatus } from '../../../types/ai';

const CLOUD_POLICY_KEY = 'aegis_local_cloud_opt_in';

export class PrivacyBoundary {
  private static inMemoryCloudOptIn: boolean | null = null;

  /**
   * Retrieves whether the user has explicitly authorized server-side cloud AI fallback
   */
  static isCloudOptInAllowed(): boolean {
    if (PrivacyBoundary.inMemoryCloudOptIn !== null) {
      return PrivacyBoundary.inMemoryCloudOptIn;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(CLOUD_POLICY_KEY);
        if (stored !== null) {
          return stored === 'true';
        }
      }
    } catch {
      // ignore
    }
    // Strictly default to false: Never assume cloud permission unless explicitly enabled by user
    return false;
  }

  /**
   * Updates cloud opt-in policy
   */
  static setCloudOptInAllowed(allowed: boolean): void {
    PrivacyBoundary.inMemoryCloudOptIn = allowed;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CLOUD_POLICY_KEY, String(allowed));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Returns honest, transparent processing location reflecting active provider & runtime reality
   */
  static getProcessingLocation(
    provider: AIProvider | null | undefined,
    status: AIProviderStatus | null | undefined
  ): AIProcessingLocation {
    if (!provider || !status) {
      return 'Unknown / unavailable';
    }

    if (!status.configured) {
      return 'Not configured';
    }

    if (!status.available) {
      return 'Unknown / unavailable';
    }

    // Only report Snapdragon NPU if actually verified available and execution target matches
    if (provider.id === 'snapdragon-provider' && status.available) {
      return 'Snapdragon NPU';
    }

    if (provider.capabilities.isLocal && status.available) {
      return 'Local / On-device';
    }

    if (status.available && !provider.capabilities.isLocal) {
      return 'Cloud';
    }

    return 'Not configured';
  }

  /**
   * Checks if an outbound request can proceed given the provider and user privacy policies
   */
  static canDispatchToProvider(provider: AIProvider): { allowed: boolean; reason?: string } {
    if (provider.capabilities.isLocal) {
      return { allowed: true };
    }

    // Remote / Cloud provider
    if (!this.isCloudOptInAllowed()) {
      return {
        allowed: false,
        reason:
          'Cloud AI fallback is disabled in Privacy Settings. Private project files will not be dispatched to remote endpoints without explicit user opt-in.',
      };
    }

    return { allowed: true };
  }
}
