import { HardwareExecutionTarget } from '../../../types/snapdragon';

export interface ModelExecutionRequest {
  modelId: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  target?: HardwareExecutionTarget;
  context?: string;
}

export interface ModelExecutionResult {
  text: string;
  executionTarget: HardwareExecutionTarget;
  verifiedNpuExecution: boolean;
  latencyMs: number;
  tokensGenerated?: number;
  memoryUsageMb?: number;
  runtimeVersion?: string;
}

export interface ModelAdapter {
  readonly name: string;
  readonly supportedTargets: HardwareExecutionTarget[];
  isAvailable(): Promise<boolean>;
  loadModel(modelId: string, target?: HardwareExecutionTarget): Promise<boolean>;
  unloadModel(modelId: string): Promise<boolean>;
  execute(request: ModelExecutionRequest): Promise<ModelExecutionResult>;
  stream(
    request: ModelExecutionRequest,
    onChunk: (chunk: string) => void
  ): Promise<ModelExecutionResult>;
}
