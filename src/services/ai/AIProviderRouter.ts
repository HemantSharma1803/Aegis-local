import { AIProvider, AIProviderStatus, AIRequest, AIResponse, AIProviderCapabilities } from '../../types/ai';
import { aiProviderRegistry } from './AIProviderRegistry';
import { PrivacyBoundary } from './privacy/PrivacyBoundary';
import { offlineGroundedProvider } from './OfflineGroundedProvider';

const PREFERRED_PROVIDER_KEY = 'aegis_preferred_ai_provider';

export type AITaskOperation =
  | 'text-generation'
  | 'structured-text'
  | 'embeddings'
  | 'speech-analysis'
  | 'judge-simulation'
  | 'ask-aegis'
  | 'prepare-me'
  | 'judge-mode'
  | 'voice-practice'
  | 'readiness'
  | 'project-knowledge';

export interface RouteResolution {
  provider: AIProvider;
  status: AIProviderStatus;
  isFallback: boolean;
  notes?: string;
  taskSupported?: boolean;
  unsupportedReason?: string;
}

export class AIProviderRouter {
  /**
   * Checks if a provider's capabilities can handle a specific AI task.
   */
  canHandle(
    operation: AITaskOperation | string,
    capabilities: AIProviderCapabilities
  ): { supported: boolean; reason?: string } {
    switch (operation) {
      case 'text-generation':
      case 'ask-aegis':
        return capabilities.textGeneration
          ? { supported: true }
          : { supported: false, reason: 'Provider does not support text generation' };
      case 'structured-text':
      case 'prepare-me':
        return capabilities.structuredJson || capabilities.textGeneration
          ? { supported: true }
          : { supported: false, reason: 'Provider does not support structured text generation' };
      case 'judge-simulation':
      case 'judge-mode':
        return capabilities.textGeneration
          ? { supported: true }
          : { supported: false, reason: 'Judge simulation requires text generation capability' };
      case 'speech-analysis':
      case 'voice-practice':
        return capabilities.textGeneration
          ? { supported: true }
          : { supported: false, reason: 'Voice practice evaluation requires text generation capability' };
      case 'readiness':
        return capabilities.textGeneration
          ? { supported: true }
          : { supported: false, reason: 'Readiness report narrative synthesis requires text generation' };
      case 'embeddings':
      case 'project-knowledge':
        return capabilities.embeddings
          ? { supported: true }
          : { supported: false, reason: 'Provider does not support project-scoped vector embeddings' };
      default:
        return { supported: true };
    }
  }

  /**
   * Resolves the highest priority available AI provider based on genuine runtime reality:
   * 1. SnapdragonProvider when genuinely available on device
   * 2. LocalProvider when configured and running
   * 3. CloudProvider ONLY when explicitly enabled by user and server key configured
   * 4. OfflineGroundedProvider as reliable client-side deterministic fallback
   */
  async resolveProvider(operation?: AITaskOperation | string): Promise<RouteResolution> {
    const preference = this.getPreferredProvider();

    // Helper to evaluate provider with capability check
    const evaluate = async (prov: AIProvider, isFallback: boolean, notes?: string): Promise<RouteResolution> => {
      const status = await prov.status();
      const capCheck = operation ? this.canHandle(operation, prov.capabilities) : { supported: true };
      return {
        provider: prov,
        status,
        isFallback,
        notes,
        taskSupported: capCheck.supported,
        unsupportedReason: capCheck.reason,
      };
    };

    // 1. If user explicitly selected a specific provider, check that provider first
    if (preference && preference !== 'auto') {
      const explicit = aiProviderRegistry.getProvider(preference);
      if (explicit) {
        const status = await explicit.status();
        if (status.available) {
          const capCheck = operation ? this.canHandle(operation, explicit.capabilities) : { supported: true };
          return {
            provider: explicit,
            status,
            isFallback: false,
            taskSupported: capCheck.supported,
            unsupportedReason: capCheck.reason,
          };
        } else {
          // If the user's explicitly chosen provider is unavailable, DO NOT silently route elsewhere
          return {
            provider: explicit,
            status,
            isFallback: false,
            notes: `Selected provider "${explicit.name}" is currently unavailable: ${status.message}`,
            taskSupported: false,
            unsupportedReason: status.message,
          };
        }
      }
    }

    // 2. Automated Priority Route Selection:
    // Priority 1: Snapdragon NPU (Hardware Acceleration)
    const snapdragon = aiProviderRegistry.getProvider('snapdragon-provider');
    if (snapdragon) {
      const sStatus = await snapdragon.status();
      if (sStatus.available) {
        return evaluate(snapdragon, false, 'Active hardware routing: Qualcomm Snapdragon Hexagon NPU');
      }
    }

    // Priority 2: Local on-device host runtime (Ollama / Llama.cpp)
    const local = aiProviderRegistry.getProvider('local-provider');
    if (local) {
      const lStatus = await local.status();
      if (lStatus.available) {
        return evaluate(local, false, 'Active local routing: On-Device CPU/GPU Host Runtime');
      }
    }

    // Priority 3: Cloud Enclave (Only if explicit cloud opt-in is enabled by user)
    const cloudAllowed = PrivacyBoundary.isCloudOptInAllowed();
    const cloud = aiProviderRegistry.getProvider('gemini-provider');
    if (cloud && cloudAllowed) {
      const cStatus = await cloud.status();
      if (cStatus.available) {
        return evaluate(cloud, true, 'Cloud Enclave Fallback active (Explicit user opt-in verified).');
      }
    }

    // 3. Standby: When neither Snapdragon, Local Host, nor Cloud are currently available
    const standby = local || snapdragon || aiProviderRegistry.getAllProviders()[0];
    return evaluate(
      standby,
      false,
      'No hardware or local AI provider is active. Deterministic offline grounded analysis is ready.'
    );
  }

  /**
   * Safe execution wrapper: executes request through routed provider with privacy safeguards
   */
  async execute<T = any>(
    request: AIRequest,
    operation?: AITaskOperation | string
  ): Promise<AIResponse<T>> {
    const resolution = await this.resolveProvider(operation);

    if (!resolution.status.available) {
      return offlineGroundedProvider.answerQuestion(request) as Promise<AIResponse<T>>;
    }

    if (resolution.taskSupported === false) {
      return {
        answer: `AI capability limitation: ${resolution.unsupportedReason || 'This provider cannot execute the requested task operation.'}`,
        sources: [],
        provider: resolution.provider.name,
        providerId: resolution.provider.id,
        processingMode: resolution.status.processingLocation || 'Not configured',
        executionTarget: resolution.provider.modelConfig.executionTarget,
        grounded: false,
        error: resolution.unsupportedReason,
      };
    }

    return resolution.provider.generate<T>(request);
  }

  /**
   * Unified Prepare Me generation router
   */
  async generatePreparationPlan(request: any): Promise<any> {
    const resolution = await this.resolveProvider('prepare-me');
    if (resolution.status.available && resolution.provider.generatePreparationPlan) {
      try {
        return await resolution.provider.generatePreparationPlan(request);
      } catch (err) {
        console.warn(`[AIProviderRouter] generatePreparationPlan failed on ${resolution.provider.name}, falling back:`, err);
      }
    }
    return offlineGroundedProvider.generatePreparationPlan(request);
  }

  /**
   * Unified Judge question generation router
   */
  async generateJudgeQuestion(request: any): Promise<any> {
    const resolution = await this.resolveProvider('judge-mode');
    if (resolution.status.available && resolution.provider.generateJudgeQuestion) {
      try {
        const q = await resolution.provider.generateJudgeQuestion(request);
        if (q && q.question) return q;
      } catch (err) {
        console.warn(`[AIProviderRouter] generateJudgeQuestion failed on ${resolution.provider.name}, falling back:`, err);
      }
    }
    return offlineGroundedProvider.generateJudgeQuestion(request);
  }

  /**
   * Unified Judge answer evaluation router
   */
  async evaluateJudgeAnswer(request: any): Promise<any> {
    const resolution = await this.resolveProvider('judge-mode');
    if (resolution.status.available && resolution.provider.evaluateJudgeAnswer) {
      try {
        const evalRes = await resolution.provider.evaluateJudgeAnswer(request);
        if (evalRes && evalRes.overallAssessment) return evalRes;
      } catch (err) {
        console.warn(`[AIProviderRouter] evaluateJudgeAnswer failed on ${resolution.provider.name}, falling back:`, err);
      }
    }
    return offlineGroundedProvider.evaluateJudgeAnswer(request);
  }

  /**
   * Unified Judge session summary router
   */
  async summarizeJudgeSession(request: any): Promise<any> {
    const resolution = await this.resolveProvider('judge-mode');
    if (resolution.status.available && resolution.provider.summarizeJudgeSession) {
      try {
        const sum = await resolution.provider.summarizeJudgeSession(request);
        if (sum && sum.summary) return sum;
      } catch (err) {
        console.warn(`[AIProviderRouter] summarizeJudgeSession failed on ${resolution.provider.name}, falling back:`, err);
      }
    }
    return offlineGroundedProvider.summarizeJudgeSession(request);
  }

  /**
   * Unified Voice Practice analysis router
   */
  async analyzeVoicePractice(request: any): Promise<any> {
    const resolution = await this.resolveProvider('voice-practice');
    if (resolution.status.available && resolution.provider.analyzeVoicePractice) {
      try {
        const res = await resolution.provider.analyzeVoicePractice(request);
        if (res && res.summary) return res;
      } catch (err) {
        console.warn(`[AIProviderRouter] analyzeVoicePractice failed on ${resolution.provider.name}, falling back:`, err);
      }
    }
    return offlineGroundedProvider.analyzeVoicePractice(request);
  }

  /**
   * Unified Readiness Report synthesis router
   */
  async synthesizeReadinessReport(request: any): Promise<any> {
    const resolution = await this.resolveProvider('readiness');
    // If cloud provider is active and server enclave exists
    if (resolution.status.available && resolution.provider.id === 'gemini-provider') {
      try {
        const res = await fetch('/api/ai/readiness/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[AIProviderRouter] Remote readiness synthesis failed, falling back:', err);
      }
    }
    return offlineGroundedProvider.synthesizeReadinessReport(request);
  }

  getPreferredProvider(): string {
    try {
      return localStorage.getItem(PREFERRED_PROVIDER_KEY) || 'auto';
    } catch {
      return 'auto';
    }
  }

  setPreferredProvider(id: string): void {
    try {
      localStorage.setItem(PREFERRED_PROVIDER_KEY, id);
      if (id !== 'auto' && aiProviderRegistry.getProvider(id)) {
        aiProviderRegistry.setActiveProvider(id);
      }
    } catch {
      // ignore
    }
  }
}

export const aiProviderRouter = new AIProviderRouter();

