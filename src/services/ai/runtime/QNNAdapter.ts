import { ModelAdapter, ModelExecutionRequest, ModelExecutionResult } from './ModelAdapter';
import { HardwareExecutionTarget } from '../../../types/snapdragon';
import { RuntimeDetector } from './RuntimeDetector';

export class QNNAdapter implements ModelAdapter {
  readonly name = 'Qualcomm QNN Adapter (Qualcomm AI Engine)';
  readonly supportedTargets: HardwareExecutionTarget[] = ['npu'];
  private bridgeUrl = 'http://127.0.0.1:29999';
  private isLoaded = false;
  private activeModelId: string | null = null;

  async isAvailable(): Promise<boolean> {
    const profile = await RuntimeDetector.detectDeviceProfile();
    return profile.npuAvailable;
  }

  async loadModel(modelId: string, target?: HardwareExecutionTarget): Promise<boolean> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        `Qualcomm QNN hardware bridge is not available. Please ensure the system is a Snapdragon-powered Windows PC with the Qualcomm AI Engine driver installed.`
      );
    }

    // Attempt model load via local QNN bridge daemon
    try {
      const res = await fetch(`${this.bridgeUrl}/models/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, target: 'npu' }),
      });
      if (res.ok) {
        this.isLoaded = true;
        this.activeModelId = modelId;
        return true;
      }
    } catch {
      // Inactive
    }

    // Also check window.__QUALCOMM_QNN_BRIDGE__
    if (typeof window !== 'undefined' && (window as any).__QUALCOMM_QNN_BRIDGE__) {
      const bridge = (window as any).__QUALCOMM_QNN_BRIDGE__;
      await bridge.loadModel(modelId);
      this.isLoaded = true;
      this.activeModelId = modelId;
      return true;
    }

    throw new Error(`Failed to load QNN model '${modelId}' onto Snapdragon Hexagon NPU.`);
  }

  async unloadModel(modelId: string): Promise<boolean> {
    this.isLoaded = false;
    this.activeModelId = null;
    return true;
  }

  async execute(request: ModelExecutionRequest): Promise<ModelExecutionResult> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        `Snapdragon QNN execution is unavailable. Snapdragon NPU runtime not detected in this environment.`
      );
    }

    const startTime = performance.now();

    // Check window.__QUALCOMM_QNN_BRIDGE__
    if (typeof window !== 'undefined' && (window as any).__QUALCOMM_QNN_BRIDGE__) {
      const bridge = (window as any).__QUALCOMM_QNN_BRIDGE__;
      const res = await bridge.infer({
        prompt: request.prompt,
        maxTokens: request.maxTokens,
        context: request.context,
      });
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        text: res.text,
        executionTarget: 'npu',
        verifiedNpuExecution: true,
        latencyMs,
        tokensGenerated: res.tokensGenerated,
      };
    }

    // Check local companion daemon
    const res = await fetch(`${this.bridgeUrl}/infer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.modelId,
        prompt: request.prompt,
        context: request.context,
      }),
    });

    if (!res.ok) {
      throw new Error(`Snapdragon QNN infer failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      text: data.text || '',
      executionTarget: 'npu',
      verifiedNpuExecution: true,
      latencyMs,
      tokensGenerated: data.tokensGenerated,
    };
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
