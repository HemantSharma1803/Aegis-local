import { GeminiProvider } from './GeminiProvider';

/**
 * OptionalCloudProvider / CloudProvider implementation proxied via secure server-side enclave.
 * Conforms to the AIProvider interface and enforces explicit user opt-in before dispatch.
 */
export class CloudProvider extends GeminiProvider {
  // Inherits all server enclave routing and validation from GeminiProvider
}
