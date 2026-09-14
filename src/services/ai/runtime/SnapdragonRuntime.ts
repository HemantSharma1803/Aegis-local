import {
  SnapdragonRuntime as ISnapdragonRuntime,
  SnapdragonRuntimeStatus,
  SnapdragonCapabilities,
  HardwareExecutionTarget,
} from '../../../types/snapdragon';
import { RuntimeDetector } from './RuntimeDetector';
import { QNNAdapter } from './QNNAdapter';
import { ONNXAdapter } from './ONNXAdapter';
import { benchmarkingService } from './Benchmarking';

export class SnapdragonRuntime implements ISnapdragonRuntime {
  private static instance: SnapdragonRuntime;
  private qnnAdapter = new QNNAdapter();
  private onnxAdapter = new ONNXAdapter();
  private currentModelId: string | null = null;
  private statusCache: SnapdragonRuntimeStatus | null = null;
  private lastDetectTime = 0;

  static getInstance(): SnapdragonRuntime {
    if (!this.instance) {
      this.instance = new SnapdragonRuntime();
    }
    return this.instance;
  }

  async detect(): Promise<SnapdragonRuntimeStatus> {
    const profile = await RuntimeDetector.detectDeviceProfile();
    this.lastDetectTime = Date.now();

    const capabilities: SnapdragonCapabilities = {
      cpu: profile.supportedTargets.includes('cpu'),
      gpu: profile.supportedTargets.includes('gpu'),
      npu: profile.npuAvailable,
      onnx: true,
      qnn: profile.npuAvailable,
      quantization: profile.npuAvailable,
      localInference: profile.supportedTargets.length > 0,
      supportedQuantizations: profile.npuAvailable ? ['INT4', 'INT8', 'FP16'] : ['INT8', 'FP32'],
    };

    let status: SnapdragonRuntimeStatus;

    if (profile.npuAvailable) {
      status = {
        detected: true,
        available: true,
        executionTarget: 'npu',
        runtimeName: 'Qualcomm QNN SDK (Hexagon NPU Driver)',
        message: 'Snapdragon Hexagon NPU hardware accelerator active and operational.',
        activeProviderId: 'snapdragon-provider',
        deviceProfile: profile,
        activeModelId: this.currentModelId || undefined,
        capabilities,
        hardwareTarget: profile.processor || 'Qualcomm Snapdragon X Elite / Plus (45 TOPS NPU)',
        lastChecked: this.lastDetectTime,
      };
    } else {
      let msg = 'Snapdragon runtime not detected in this host environment.';
      if (profile.classification === 'Non-Snapdragon Windows') {
        msg = 'Current device is a standard Windows PC (x86_64). Snapdragon ARM64 NPU accelerator is not present.';
      } else if (profile.classification === 'Snapdragon Windows' || profile.classification === 'Snapdragon NPU unavailable') {
        msg = 'Snapdragon ARM64 Windows platform detected, but Qualcomm QNN NPU driver bridge is in standby or unconfigured.';
      } else {
        msg = 'Host environment is not a Snapdragon-powered Windows PC. Architecture is prepared for Snapdragon-optimized deployment.';
      }

      status = {
        detected: false,
        available: false,
        executionTarget: 'cpu',
        runtimeName: 'Qualcomm QNN Bridge (Standby)',
        message: msg,
        deviceProfile: profile,
        capabilities,
        hardwareTarget: 'Qualcomm Snapdragon X Elite / Plus NPU (Target)',
        lastChecked: this.lastDetectTime,
      };
    }

    this.statusCache = status;
    return status;
  }

  getStatus(): SnapdragonRuntimeStatus {
    if (this.statusCache) {
      return this.statusCache;
    }

    // Default fallback synchronous status before first async detect
    return {
      detected: false,
      available: false,
      executionTarget: 'cpu',
      runtimeName: 'Qualcomm QNN Bridge (Probing)',
      message: 'Probing system for Qualcomm Snapdragon hardware runtime...',
      deviceProfile: {
        platform: 'unknown',
        architecture: 'unknown',
        npuAvailable: false,
        runtime: 'none',
        supportedTargets: ['cpu'],
        classification: 'Unknown device',
        isARM64Windows: false,
      },
      capabilities: {
        cpu: true,
        gpu: false,
        npu: false,
        onnx: false,
        qnn: false,
        quantization: false,
        localInference: false,
      },
      hardwareTarget: 'Qualcomm Snapdragon X Elite / Plus (Target)',
      lastChecked: Date.now(),
    };
  }

  getCapabilities(): SnapdragonCapabilities {
    return this.getStatus().capabilities;
  }

  async loadModel(modelId: string): Promise<boolean> {
    const status = await this.detect();
    if (!status.available) {
      throw new Error(
        `Cannot load model '${modelId}': Snapdragon runtime is not available on this host (${status.deviceProfile.classification}).`
      );
    }

    const loaded = await this.qnnAdapter.loadModel(modelId, 'npu');
    if (loaded) {
      this.currentModelId = modelId;
    }
    return loaded;
  }

  async unloadModel(modelId: string): Promise<boolean> {
    const unloaded = await this.qnnAdapter.unloadModel(modelId);
    if (unloaded && this.currentModelId === modelId) {
      this.currentModelId = null;
    }
    return unloaded;
  }

  async generate(prompt: string, options?: { maxTokens?: number; context?: string }): Promise<string> {
    const status = await this.detect();
    if (!status.available) {
      throw new Error(
        `Snapdragon NPU inference unavailable: ${status.message}`
      );
    }

    const result = await this.qnnAdapter.execute({
      modelId: this.currentModelId || 'qualcomm-ai-hub/llama-3-8b-instruct-qnn',
      prompt,
      maxTokens: options?.maxTokens,
      context: options?.context,
      target: 'npu',
    });

    // Record verified benchmark measurement
    benchmarkingService.recordRealBenchmark({
      modelId: this.currentModelId || 'qualcomm-ai-hub/llama-3-8b-instruct-qnn',
      operation: 'generate',
      executionTarget: 'npu',
      latencyMs: result.latencyMs,
      tokensGenerated: result.tokensGenerated,
    });

    return result.text;
  }

  async stream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: { maxTokens?: number; context?: string }
  ): Promise<string> {
    const status = await this.detect();
    if (!status.available) {
      throw new Error(
        `Snapdragon NPU streaming unavailable: ${status.message}`
      );
    }

    const result = await this.qnnAdapter.stream(
      {
        modelId: this.currentModelId || 'qualcomm-ai-hub/llama-3-8b-instruct-qnn',
        prompt,
        maxTokens: options?.maxTokens,
        context: options?.context,
        target: 'npu',
      },
      onChunk
    );

    // Record verified benchmark measurement
    benchmarkingService.recordRealBenchmark({
      modelId: this.currentModelId || 'qualcomm-ai-hub/llama-3-8b-instruct-qnn',
      operation: 'stream',
      executionTarget: 'npu',
      latencyMs: result.latencyMs,
      tokensGenerated: result.tokensGenerated,
    });

    return result.text;
  }
}

export const snapdragonRuntime = SnapdragonRuntime.getInstance();
