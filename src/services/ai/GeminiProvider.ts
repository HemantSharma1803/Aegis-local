import {
  AIProvider,
  AIProviderCapabilities,
  AIProviderStatus,
  AIModelConfig,
  AIRequest,
  AIResponse,
} from '../../types/ai';
import { PrivacyBoundary } from './privacy/PrivacyBoundary';
import { ProjectIsolation } from './privacy/ProjectIsolation';
import { AIRequestValidator } from './validation/AIRequestValidator';
import { StructuredOutputValidator } from './validation/StructuredOutputValidator';

export class GeminiProvider implements AIProvider {
  id = 'gemini-provider';
  name = 'Google Gemini (Server-Side Enclave)';

  capabilities: AIProviderCapabilities = {
    textGeneration: true,
    streaming: true,
    embeddings: true,
    structuredJson: true,
    vision: true,
    speech: false,
    isLocal: false,
    isRemote: true,
    supportsStreaming: true,
    supportsGrounding: true,
    maxContextTokens: 32000,
  };

  modelConfig: AIModelConfig = {
    providerId: 'gemini-provider',
    modelId: 'gemini-3.6-flash',
    displayName: 'Google Gemini 3.6 Flash (Server-Side Enclave)',
    contextLength: 32000,
    capabilities: {
      textGeneration: true,
      streaming: true,
      embeddings: true,
      structuredJson: true,
      vision: true,
      speech: false,
      isLocal: false,
      isRemote: true,
      supportsStreaming: true,
      supportsGrounding: true,
    },
    executionTarget: 'cloud',
    recommendedHardware: 'Any client (Processed on secure server enclave)',
    notes: 'Secure server-side API proxy. API secrets are never delivered to the client.',
  };

  private availableCache: boolean | null = null;
  private lastCheck = 0;

  async isAvailable(): Promise<boolean> {
    const s = await this.status();
    return s.available;
  }

  async status(): Promise<AIProviderStatus> {
    // Check if cloud opt-in is allowed
    const cloudAllowed = PrivacyBoundary.isCloudOptInAllowed();
    if (!cloudAllowed) {
      return {
        id: this.id,
        name: this.name,
        available: false,
        configured: true,
        local: false,
        model: this.modelConfig.displayName,
        executionTarget: 'cloud',
        processingLocation: 'Not configured',
        message:
          'Cloud fallback disabled by user privacy policy. Enable cloud processing in Settings to permit remote inference.',
        capabilities: this.capabilities,
        hardwareTarget: 'Google Cloud TPU/GPU Enclave',
        lastChecked: Date.now(),
      };
    }

    const now = Date.now();
    if (this.availableCache !== null && now - this.lastCheck < 15000) {
      return this.buildStatus(this.availableCache);
    }

    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        const data = await res.json();
        this.availableCache = Boolean(data.available);
        this.lastCheck = now;
        return this.buildStatus(this.availableCache);
      }
      this.availableCache = false;
      return this.buildStatus(false);
    } catch {
      this.availableCache = false;
      return this.buildStatus(false);
    }
  }

  private buildStatus(available: boolean): AIProviderStatus {
    if (available) {
      return {
        id: this.id,
        name: this.name,
        available: true,
        configured: true,
        local: false,
        model: this.modelConfig.displayName,
        executionTarget: 'cloud',
        processingLocation: 'Cloud',
        message: 'Server-side Gemini enclave ready and configured.',
        capabilities: this.capabilities,
        hardwareTarget: 'Google Cloud Tensor Processing Units',
        lastChecked: this.lastCheck,
      };
    }

    return {
      id: this.id,
      name: this.name,
      available: false,
      configured: false,
      local: false,
      model: this.modelConfig.displayName,
      executionTarget: 'cloud',
      processingLocation: 'Not configured',
      message:
        'Cloud AI provider not configured. Please configure your GEMINI_API_KEY in the application settings or runtime environment.',
      capabilities: this.capabilities,
      hardwareTarget: 'Server-Side Cloud Enclave',
      missingRequirements: ['GEMINI_API_KEY environment variable on server'],
      lastChecked: this.lastCheck,
    };
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    // 1. Validate request
    const validation = AIRequestValidator.validate(request);
    if (!validation.valid) {
      return {
        answer: 'Invalid AI request payload.',
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'cloud',
        grounded: false,
        error: validation.errors.join('; '),
      };
    }

    // 2. Check privacy boundary
    const privacyCheck = PrivacyBoundary.canDispatchToProvider(this);
    if (!privacyCheck.allowed) {
      return {
        answer: privacyCheck.reason || 'Cloud dispatch blocked by privacy policy.',
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'cloud',
        grounded: false,
        error: privacyCheck.reason,
      };
    }

    // 3. Project isolation
    const isolatedContext = ProjectIsolation.isolateContext(
      request.projectId,
      request.context
    );

    const sanitizedReq = {
      ...validation.sanitizedRequest!,
      context: isolatedContext,
      question: request.question || request.prompt,
    };

    ProjectIsolation.logSafeDiagnostic('generate', request.projectId, this.id);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedReq),
      });

      if (!response.ok) {
        let errorMsg = `Server returned HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const data: AIResponse = await response.json();
      return {
        ...data,
        providerId: this.id,
        processingMode: 'Cloud',
        executionTarget: 'cloud',
      };
    } catch (err: any) {
      return {
        answer:
          "I couldn't reach the configured AI provider. Check your AI settings and try again.",
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'cloud',
        grounded: false,
        error: err.message || 'Network request failed',
      };
    }
  }

  async answerQuestion(request: AIRequest): Promise<AIResponse> {
    return this.generate(request);
  }

  async streamQuestion(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const privacyCheck = PrivacyBoundary.canDispatchToProvider(this);
    if (!privacyCheck.allowed) {
      const errorMsg = privacyCheck.reason || 'Cloud fallback disabled.';
      return {
        answer: errorMsg,
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'cloud',
        grounded: false,
        error: errorMsg,
      };
    }

    try {
      const isolatedContext = ProjectIsolation.isolateContext(
        request.projectId,
        request.context
      );

      const payload = {
        ...request,
        context: isolatedContext,
        question: request.question || request.prompt,
      };

      ProjectIsolation.logSafeDiagnostic('stream', request.projectId, this.id);

      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = `Server returned HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser or response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';
      let serverResponseMeta: Partial<AIResponse> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace(/^data: /, '').trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.chunk) {
                fullAnswer += parsed.chunk;
                onChunk(parsed.chunk);
              }
              if (parsed.meta) {
                serverResponseMeta = parsed.meta;
              }
            } catch {
              // ignore parse errors on streaming chunks
            }
          }
        }
      }

      const sources = serverResponseMeta.sources || request.context.sourceAttributions || [];
      return {
        answer: fullAnswer || serverResponseMeta.answer || '',
        sources,
        provider: this.name,
        providerId: this.id,
        processingMode: 'Cloud',
        executionTarget: 'cloud',
        grounded: serverResponseMeta.grounded ?? true,
        isGeneralKnowledge: serverResponseMeta.isGeneralKnowledge ?? false,
      };
    } catch (err: any) {
      console.warn('[GeminiProvider] Stream failed, falling back to standard ask:', err);
      return this.answerQuestion(request);
    }
  }

  async stream(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    return this.streamQuestion(request, onChunk);
  }

  async generatePreparationPlan(request: any): Promise<any> {
    const privacyCheck = PrivacyBoundary.canDispatchToProvider(this);
    if (!privacyCheck.allowed) {
      throw new Error(privacyCheck.reason || 'Cloud fallback disabled.');
    }

    const response = await fetch('/api/ai/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) errorMsg = errData.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const plan = await response.json();
    const validation = StructuredOutputValidator.validatePreparationPlan(plan);
    if (!validation.valid) {
      throw new Error(`Invalid plan generated: ${validation.errors.join(', ')}`);
    }
    return validation.data;
  }

  async generateJudgeQuestion(request: any): Promise<any> {
    const privacyCheck = PrivacyBoundary.canDispatchToProvider(this);
    if (!privacyCheck.allowed) {
      throw new Error(privacyCheck.reason || 'Cloud fallback disabled.');
    }

    const response = await fetch('/api/ai/judge/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) errorMsg = errData.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const rawQuestion = await response.json();
    const validation = StructuredOutputValidator.validateJudgeQuestion(rawQuestion);
    if (!validation.valid) {
      throw new Error(`Invalid judge question: ${validation.errors.join(', ')}`);
    }
    return validation.data;
  }

  async evaluateJudgeAnswer(request: any): Promise<any> {
    const privacyCheck = PrivacyBoundary.canDispatchToProvider(this);
    if (!privacyCheck.allowed) {
      throw new Error(privacyCheck.reason || 'Cloud fallback disabled.');
    }

    const response = await fetch('/api/ai/judge/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) errorMsg = errData.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const rawEval = await response.json();
    const validation = StructuredOutputValidator.validateAnswerEvaluation(rawEval);
    if (!validation.valid) {
      throw new Error(`Invalid answer evaluation: ${validation.errors.join(', ')}`);
    }
    return validation.data;
  }

  async summarizeJudgeSession(request: any): Promise<any> {
    const privacyCheck = PrivacyBoundary.canDispatchToProvider(this);
    if (!privacyCheck.allowed) {
      throw new Error(privacyCheck.reason || 'Cloud fallback disabled.');
    }

    const response = await fetch('/api/ai/judge/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) errorMsg = errData.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const rawSummary = await response.json();
    return rawSummary;
  }

  async analyzeVoicePractice(request: any): Promise<any> {
    const privacyCheck = PrivacyBoundary.canDispatchToProvider(this);
    if (!privacyCheck.allowed) {
      throw new Error(privacyCheck.reason || 'Cloud fallback disabled.');
    }

    const response = await fetch('/api/ai/voice-practice/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) errorMsg = errData.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const rawResult = await response.json();
    const validation = StructuredOutputValidator.validateVoicePracticeResult(rawResult);
    if (!validation.valid) {
      throw new Error(`Invalid voice evaluation result: ${validation.errors.join(', ')}`);
    }
    return validation.data;
  }
}
