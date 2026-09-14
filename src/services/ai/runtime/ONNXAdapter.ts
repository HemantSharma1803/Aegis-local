import { ModelAdapter, ModelExecutionRequest, ModelExecutionResult } from './ModelAdapter';
import { HardwareExecutionTarget } from '../../../types/snapdragon';
import { RuntimeDetector } from './RuntimeDetector';

export class ONNXAdapter implements ModelAdapter {
  readonly name = 'ONNX Runtime Adapter';
  readonly supportedTargets: HardwareExecutionTarget[] = ['cpu', 'gpu', 'npu'];
  private loadedModels = new Set<string>();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async loadModel(modelId: string, target: HardwareExecutionTarget = 'cpu'): Promise<boolean> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`ONNX Runtime is not available on this host environment.`);
    }

    // Only allow NPU target if genuine NPU is detected
    if (target === 'npu') {
      const profile = await RuntimeDetector.detectDeviceProfile();
      if (!profile.npuAvailable) {
        throw new Error(
          `Cannot load model on NPU target: Snapdragon NPU runtime (QNN Execution Provider) is not verified on this system.`
        );
      }
    }

    this.loadedModels.add(modelId);
    return true;
  }

  async unloadModel(modelId: string): Promise<boolean> {
    this.loadedModels.delete(modelId);
    return true;
  }

  async execute(request: ModelExecutionRequest): Promise<ModelExecutionResult> {
    const profile = await RuntimeDetector.detectDeviceProfile();
    const startTime = performance.now();

    // Determine honest execution target
    let resolvedTarget: HardwareExecutionTarget = 'cpu';
    let verifiedNpu = false;

    if (request.target === 'npu' && profile.npuAvailable) {
      resolvedTarget = 'npu';
      verifiedNpu = true;
    } else if (request.target === 'gpu' && profile.supportedTargets.includes('gpu')) {
      resolvedTarget = 'gpu';
    } else {
      resolvedTarget = 'cpu';
    }

    // If attempting NPU when not available, reject rather than silently falsifying
    if (request.target === 'npu' && !verifiedNpu) {
      throw new Error(
        `NPU execution requested, but verified Snapdragon Hexagon NPU is not available on this device (${profile.classification}).`
      );
    }

    // Check for native IPC bridge
    if (typeof window !== 'undefined' && (window as any).__ONNX_RUNTIME__) {
      const ort = (window as any).__ONNX_RUNTIME__;
      const res = await ort.run(request.modelId, request.prompt, { target: resolvedTarget });
      const elapsed = performance.now() - startTime;
      return {
        text: res.text,
        executionTarget: resolvedTarget,
        verifiedNpuExecution: verifiedNpu,
        latencyMs: Math.round(elapsed),
        tokensGenerated: res.tokensGenerated,
      };
    }

    throw new Error(
      `ONNX Runtime engine not initialized. Please configure the ONNX execution provider in local runtime settings.`
    );
  }

  async stream(
    request: ModelExecutionRequest,
    onChunk: (chunk: string) => void
  ): Promise<ModelExecutionResult> {
    const res = await this.execute(request);
    if (res.text) {
      onChunk(res.text);
    }
    return res;
  }
}
