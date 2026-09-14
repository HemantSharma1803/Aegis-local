import {
  OptimizedModel,
  ModelTask,
  ModelFormat,
  HardwareExecutionTarget,
  ModelAvailabilityStatus,
} from '../../../types/snapdragon';
import { RuntimeDetector } from './RuntimeDetector';

export class ModelRegistry {
  private static instance: ModelRegistry;

  // Catalog of supported model architectures prepared for Snapdragon / Local deployment
  private models: OptimizedModel[] = [
    {
      modelId: 'qualcomm-ai-hub/llama-3-8b-instruct-qnn',
      displayName: 'Llama 3 8B Instruct (QNN NPU)',
      format: 'qnn',
      task: 'text-generation',
      supportedRuntime: 'qnn',
      executionTargets: ['npu'],
      quantization: 'INT4',
      qualcommAiHubReady: true,
      sizeMb: 4850,
      contextLength: 8192,
      status: 'runtime-unavailable',
      notes: 'Designed for integration with Qualcomm AI Hub optimized models. Requires Hexagon NPU.',
    },
    {
      modelId: 'qualcomm-ai-hub/phi-3-mini-4k-qnn',
      displayName: 'Phi-3 Mini 4K Instruct (QNN NPU)',
      format: 'qnn',
      task: 'text-generation',
      supportedRuntime: 'qnn',
      executionTargets: ['npu'],
      quantization: 'INT4',
      qualcommAiHubReady: true,
      sizeMb: 2300,
      contextLength: 4096,
      status: 'runtime-unavailable',
      notes: 'Compact parameter budget optimized for high-efficiency on-device verbal practice and defense simulation.',
    },
    {
      modelId: 'qualcomm-ai-hub/bge-small-en-v1.5-qnn',
      displayName: 'BGE Small EN v1.5 Embeddings (QNN NPU)',
      format: 'qnn',
      task: 'embeddings',
      supportedRuntime: 'qnn',
      executionTargets: ['npu', 'cpu'],
      quantization: 'INT8',
      qualcommAiHubReady: true,
      sizeMb: 135,
      contextLength: 512,
      status: 'runtime-unavailable',
      notes: 'High-speed local dense embeddings for offline project context vector indexing on NPU.',
    },
    {
      modelId: 'onnx-directml/mistral-7b-instruct-v0.2',
      displayName: 'Mistral 7B Instruct v0.2 (DirectML / ORT)',
      format: 'onnx',
      task: 'text-generation',
      supportedRuntime: 'onnx-directml',
      executionTargets: ['gpu', 'cpu'],
      quantization: 'INT4',
      qualcommAiHubReady: false,
      sizeMb: 4200,
      contextLength: 8192,
      status: 'runtime-unavailable',
      notes: 'DirectML execution provider for Windows DirectX 12 compatible GPUs and integrated graphics.',
    },
    {
      modelId: 'onnx-community/whisper-tiny-en',
      displayName: 'Whisper Tiny EN (Speech Recognition)',
      format: 'onnx',
      task: 'speech',
      supportedRuntime: 'onnx-cpu',
      executionTargets: ['cpu', 'npu'],
      quantization: 'INT8',
      qualcommAiHubReady: true,
      sizeMb: 75,
      contextLength: 448,
      status: 'download-required',
      notes: 'Local offline transcription fallback for Voice Practice verbal defense drills.',
    },
    {
      modelId: 'onnx-community/bge-micro-embeddings',
      displayName: 'BGE Micro Embeddings (Local Host CPU)',
      format: 'onnx',
      task: 'embeddings',
      supportedRuntime: 'onnx-cpu',
      executionTargets: ['cpu'],
      quantization: 'INT8',
      qualcommAiHubReady: false,
      sizeMb: 45,
      contextLength: 512,
      status: 'download-required',
      notes: 'Lightweight CPU embeddings runner for instant offline project file search.',
    },
  ];

  static getInstance(): ModelRegistry {
    if (!this.instance) {
      this.instance = new ModelRegistry();
    }
    return this.instance;
  }

  /**
   * Returns all models in registry with live evaluated status based on device profile.
   */
  async getModels(): Promise<OptimizedModel[]> {
    const profile = await RuntimeDetector.detectDeviceProfile();

    return this.models.map((model) => {
      let status: ModelAvailabilityStatus = model.status;

      if (model.format === 'qnn') {
        if (!profile.npuAvailable) {
          status = profile.isARM64Windows ? 'runtime-unavailable' : 'hardware-incompatible';
        } else {
          status = 'available';
        }
      } else if (model.supportedRuntime === 'onnx-directml') {
        if (!profile.supportedTargets.includes('gpu')) {
          status = 'hardware-incompatible';
        } else {
          status = 'download-required';
        }
      }

      return {
        ...model,
        status,
      };
    });
  }

  /**
   * Find models by task (text-generation, embeddings, speech, classification)
   */
  async getModelsByTask(task: ModelTask): Promise<OptimizedModel[]> {
    const all = await this.getModels();
    return all.filter((m) => m.task === task);
  }

  /**
   * Find model by ID
   */
  async getModelById(modelId: string): Promise<OptimizedModel | undefined> {
    const all = await this.getModels();
    return all.find((m) => m.modelId === modelId);
  }

  /**
   * Discovers models that are compatible with the current device profile.
   */
  async getCompatibleModels(): Promise<OptimizedModel[]> {
    const all = await this.getModels();
    return all.filter((m) => m.status !== 'hardware-incompatible');
  }
}

export const modelRegistry = ModelRegistry.getInstance();
