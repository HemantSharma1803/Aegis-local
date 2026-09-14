import {
  AIProvider,
  AIProviderCapabilities,
  AIProviderStatus,
  AIModelConfig,
  AIRequest,
  AIResponse,
} from '../../types/ai';

export class LocalProvider implements AIProvider {
  id = 'local-provider';
  name = 'On-Device Local Inference Engine';

  capabilities: AIProviderCapabilities = {
    textGeneration: true,
    streaming: false,
    embeddings: true,
    structuredJson: true,
    vision: false,
    speech: false,
    isLocal: true,
    isRemote: false,
    supportsStreaming: false,
    supportsGrounding: true,
    maxContextTokens: 8192,
  };

  modelConfig: AIModelConfig = {
    providerId: 'local-provider',
    modelId: 'phi-3-mini-4k-instruct-q4',
    displayName: 'Phi-3 Mini 4K (Quantized GGUF/ONNX)',
    contextLength: 4096,
    capabilities: {
      textGeneration: true,
      streaming: false,
      embeddings: true,
      structuredJson: true,
      vision: false,
      speech: false,
      isLocal: true,
      isRemote: false,
      supportsStreaming: false,
      supportsGrounding: true,
    },
    executionTarget: 'local-runtime',
    quantization: 'INT4 AWQ / GGUF',
    recommendedHardware: 'Windows 11 PC with 16GB RAM or AVX2 / Vulkan support',
    notes: 'Local CPU/GPU inference via background runtime bridge',
  };

  private localEndpointUrl = 'http://127.0.0.1:11434';
  private runtimeDetected: boolean = false;
  private lastCheckTime = 0;

  async isAvailable(): Promise<boolean> {
    const status = await this.status();
    return status.available;
  }

  async status(): Promise<AIProviderStatus> {
    const now = Date.now();
    // Cache check for 10 seconds
    if (now - this.lastCheckTime < 10000 && this.runtimeDetected !== undefined) {
      return this.buildStatusObject(this.runtimeDetected);
    }

    this.lastCheckTime = now;

    try {
      // Non-blocking ping to local runtime host (e.g. Ollama, llama.cpp server, or on-device daemon)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${this.localEndpointUrl}/api/version`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        this.runtimeDetected = true;
        return this.buildStatusObject(true);
      }
    } catch {
      // Local runtime not responding
    }

    this.runtimeDetected = false;
    return this.buildStatusObject(false);
  }

  private buildStatusObject(detected: boolean): AIProviderStatus {
    if (detected) {
      return {
        id: this.id,
        name: this.name,
        available: true,
        configured: true,
        local: true,
        model: this.modelConfig.displayName,
        executionTarget: 'local-runtime',
        processingLocation: 'Local / On-device',
        message: 'Local model runtime active on host (127.0.0.1).',
        capabilities: this.capabilities,
        hardwareTarget: 'Local CPU / DirectML',
        lastChecked: this.lastCheckTime,
      };
    }

    return {
      id: this.id,
      name: this.name,
      available: false,
      configured: false,
      local: true,
      model: this.modelConfig.displayName,
      executionTarget: 'local-runtime',
      processingLocation: 'Not configured',
      message:
        'Local AI runtime not configured. No local GGUF/ONNX host runtime responding on 127.0.0.1:11434.',
      capabilities: this.capabilities,
      hardwareTarget: 'Host Windows PC',
      missingRequirements: [
        'Local model runtime host (e.g. Llama.cpp, Ollama, or ONNX Runtime Host)',
        'Model weights file downloaded and loaded into memory (e.g. phi-3-mini-4k)',
      ],
      lastChecked: this.lastCheckTime,
    };
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const status = await this.status();
    if (!status.available) {
      return {
        answer:
          'Local AI runtime not configured. No local GGUF/ONNX host runtime is currently active on this device. Please start your local runtime or enable server-side enclave processing in Settings.',
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'local-runtime',
        grounded: false,
        error: status.message,
      };
    }

    // When genuinely configured, forward to local runtime HTTP API
    try {
      const res = await fetch(`${this.localEndpointUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelConfig.modelId,
          prompt: `${request.context.systemContextPrompt}\n\n${request.question || request.prompt}`,
          stream: false,
          options: { temperature: request.temperature ?? 0.2 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Local runtime error: HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        answer: data.response || '',
        sources: request.context.sourceAttributions || [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Local / On-device',
        executionTarget: 'local-runtime',
        grounded: true,
      };
    } catch (err: any) {
      return {
        answer: 'Local runtime query failed.',
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'local-runtime',
        grounded: false,
        error: err.message,
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
    // Gracefully falls back to normal generation if streaming not supported by local runtime
    const res = await this.generate(request);
    if (res.answer && !res.error) {
      onChunk(res.answer);
    }
    return res;
  }

  async generatePreparationPlan(request: any): Promise<any> {
    const status = await this.status();
    if (!status.available) {
      throw new Error(status.message);
    }
    throw new Error('Local structured preparation plan generation requires loaded model weights.');
  }

  async generateJudgeQuestion(request: any): Promise<any> {
    const status = await this.status();
    if (!status.available) {
      throw new Error(status.message);
    }
    throw new Error('Local judge generation requires active local model.');
  }

  async evaluateJudgeAnswer(request: any): Promise<any> {
    const status = await this.status();
    if (!status.available) {
      throw new Error(status.message);
    }
    throw new Error('Local judge evaluation requires active local model.');
  }

  async summarizeJudgeSession(request: any): Promise<any> {
    const status = await this.status();
    if (!status.available) {
      throw new Error(status.message);
    }
    throw new Error('Local judge summarization requires active local model.');
  }

  async analyzeVoicePractice(request: any): Promise<any> {
    const status = await this.status();
    if (!status.available) {
      throw new Error(status.message);
    }
    throw new Error('Local voice analysis requires active local model.');
  }
}
