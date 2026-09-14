import {
  AIProvider,
  AIProviderCapabilities,
  AIProviderStatus,
  AIModelConfig,
  AIRequest,
  AIResponse,
} from '../../types/ai';
import { snapdragonRuntime } from './runtime/SnapdragonRuntime';

export class SnapdragonProvider implements AIProvider {
  id = 'snapdragon-provider';
  name = 'Qualcomm Snapdragon QNN NPU Engine';


  capabilities: AIProviderCapabilities = {
    textGeneration: true,
    streaming: true,
    embeddings: true,
    structuredJson: true,
    vision: false,
    speech: true,
    isLocal: true,
    isRemote: false,
    supportsStreaming: true,
    supportsGrounding: true,
    maxContextTokens: 8192,
  };

  modelConfig: AIModelConfig = {
    providerId: 'snapdragon-provider',
    modelId: 'qualcomm-ai-hub/llama-3-8b-instruct-qnn',
    displayName: 'Llama 3 8B Instruct (Qualcomm AI Hub / QNN NPU)',
    contextLength: 8192,
    capabilities: {
      textGeneration: true,
      streaming: true,
      embeddings: true,
      structuredJson: true,
      vision: false,
      speech: true,
      isLocal: true,
      isRemote: false,
      supportsStreaming: true,
      supportsGrounding: true,
    },
    executionTarget: 'Snapdragon-NPU',
    quantization: 'INT4 / Qualcomm HTP (Hexagon Tensor Processor)',
    recommendedHardware: 'Snapdragon X Elite / Snapdragon X Plus Windows 11 PC (45 TOPS NPU)',
    notes: 'Native QNN Execution Provider via ONNX Runtime & Qualcomm AI Engine',
  };

  async isAvailable(): Promise<boolean> {
    const s = await this.status();
    return s.available;
  }

  async status(): Promise<AIProviderStatus> {
    const rtStatus = await snapdragonRuntime.detect();
    if (rtStatus.available) {
      return {
        id: this.id,
        name: this.name,
        available: true,
        configured: true,
        local: true,
        model: this.modelConfig.displayName,
        executionTarget: 'Snapdragon-NPU',
        processingLocation: 'Snapdragon NPU',
        message: rtStatus.message,
        capabilities: this.capabilities,
        hardwareTarget: rtStatus.hardwareTarget,
        lastChecked: rtStatus.lastChecked,
      };
    }

    return {
      id: this.id,
      name: this.name,
      available: false,
      configured: false,
      local: true,
      model: this.modelConfig.displayName,
      executionTarget: 'Snapdragon-NPU',
      processingLocation: 'Not configured',
      message: rtStatus.message,
      capabilities: this.capabilities,
      hardwareTarget: rtStatus.hardwareTarget,
      missingRequirements: [
        'Qualcomm AI Engine / QNN SDK (Hexagon Tensor Processor backend)',
        'ONNX Runtime QNN Execution Provider (ORT-QNN) on Windows 11 ARM64',
        'Qualcomm AI Hub compiled model asset (.dlc / .onnx with QNN EP)',
      ],
      lastChecked: rtStatus.lastChecked,
    };
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const s = await this.status();
    if (!s.available) {
      return {
        answer:
          'Snapdragon NPU inference engine is not yet connected on this host. The architecture is prepared for Snapdragon-optimized local inference once deployed on a Windows ARM64 device with the Qualcomm AI Engine.',
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'Snapdragon-NPU',
        grounded: false,
        error: s.message,
      };
    }

    // Genuinely detected hardware dispatch via runtime
    try {
      const text = await snapdragonRuntime.generate(request.prompt || request.question, {
        context: request.context.systemContextPrompt,
      });

      return {
        answer: text,
        sources: request.context.sourceAttributions || [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Snapdragon NPU',
        executionTarget: 'Snapdragon-NPU',
        grounded: true,
      };
    } catch (err: any) {
      return {
        answer: 'Qualcomm QNN dispatch error.',
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Not configured',
        executionTarget: 'Snapdragon-NPU',
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
    const s = await this.status();
    if (!s.available) {
      return this.generate(request);
    }

    try {
      const text = await snapdragonRuntime.stream(
        request.prompt || request.question,
        onChunk,
        { context: request.context.systemContextPrompt }
      );
      return {
        answer: text,
        sources: request.context.sourceAttributions || [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Snapdragon NPU',
        executionTarget: 'Snapdragon-NPU',
        grounded: true,
      };
    } catch (err: any) {
      return this.generate(request);
    }
  }


  async generatePreparationPlan(request: any): Promise<any> {
    const s = await this.status();
    if (!s.available) {
      throw new Error(s.message);
    }
    throw new Error('Snapdragon QNN preparation plan synthesis requires active NPU driver bridge.');
  }

  async generateJudgeQuestion(request: any): Promise<any> {
    const s = await this.status();
    if (!s.available) {
      throw new Error(s.message);
    }
    throw new Error('Snapdragon QNN judge simulation requires active NPU driver bridge.');
  }

  async evaluateJudgeAnswer(request: any): Promise<any> {
    const s = await this.status();
    if (!s.available) {
      throw new Error(s.message);
    }
    throw new Error('Snapdragon QNN judge evaluation requires active NPU driver bridge.');
  }

  async summarizeJudgeSession(request: any): Promise<any> {
    const s = await this.status();
    if (!s.available) {
      throw new Error(s.message);
    }
    throw new Error('Snapdragon QNN session summarization requires active NPU driver bridge.');
  }

  async analyzeVoicePractice(request: any): Promise<any> {
    const s = await this.status();
    if (!s.available) {
      throw new Error(s.message);
    }
    throw new Error('Snapdragon QNN voice practice evaluation requires active NPU driver bridge.');
  }
}
