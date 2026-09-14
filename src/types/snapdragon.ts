/**
 * Snapdragon and Local AI Runtime Types (Segment 11)
 */

export type HardwareExecutionTarget = 'cpu' | 'gpu' | 'npu' | 'cloud';

export type DevicePlatform = 'windows' | 'linux' | 'darwin' | 'unknown';
export type DeviceArchitecture = 'arm64' | 'x86_64' | 'unknown';

export type DeviceProfileClassification =
  | 'Non-Snapdragon Windows'
  | 'Snapdragon Windows'
  | 'Snapdragon NPU available'
  | 'Snapdragon NPU unavailable'
  | 'Unknown device';

export type RuntimeType =
  | 'snapdragon-qnn'
  | 'onnx-runtime'
  | 'directml'
  | 'cpu-fallback'
  | 'none';

export interface DeviceProfile {
  platform: DevicePlatform;
  architecture: DeviceArchitecture;
  processor?: string;
  npuAvailable: boolean;
  runtime: RuntimeType;
  supportedTargets: HardwareExecutionTarget[];
  classification: DeviceProfileClassification;
  isARM64Windows: boolean;
  userAgent?: string;
}

export interface SnapdragonCapabilities {
  cpu: boolean;
  gpu: boolean;
  npu: boolean;
  onnx: boolean;
  qnn: boolean;
  quantization: boolean;
  localInference: boolean;
  supportedQuantizations?: ('INT4' | 'INT8' | 'FP16' | 'FP32')[];
}

export interface SnapdragonRuntimeStatus {
  detected: boolean;
  available: boolean;
  executionTarget: HardwareExecutionTarget;
  runtimeName: string;
  message: string;
  activeProviderId?: string;
  deviceProfile: DeviceProfile;
  activeModelId?: string;
  capabilities: SnapdragonCapabilities;
  hardwareTarget: string;
  lastChecked: number;
}

export type ModelTask =
  | 'text-generation'
  | 'embeddings'
  | 'classification'
  | 'speech'
  | 'vision';

export type ModelFormat = 'onnx' | 'qnn' | 'gguf';

export type QuantizationType = 'INT4' | 'INT8' | 'FP16' | 'FP32';

export type ModelAvailabilityStatus =
  | 'available'
  | 'configured'
  | 'download-required'
  | 'runtime-unavailable'
  | 'hardware-incompatible';

export interface OptimizedModel {
  modelId: string;
  displayName: string;
  format: ModelFormat;
  task: ModelTask;
  supportedRuntime: 'qnn' | 'onnx-directml' | 'onnx-cpu' | 'gguf-host';
  executionTargets: HardwareExecutionTarget[];
  quantization?: QuantizationType;
  qualcommAiHubReady: boolean;
  sizeMb?: number;
  contextLength: number;
  status: ModelAvailabilityStatus;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  notes?: string;
}

export interface InferenceBenchmark {
  modelId: string;
  operation: string;
  executionTarget: HardwareExecutionTarget;
  latencyMs: number;
  tokensPerSecond?: number;
  memoryUsageMb?: number;
  timestamp: string;
  isRealMeasurement: true; // Prohibits fake or simulated benchmarks
}

export interface SnapdragonRuntime {
  detect(): Promise<SnapdragonRuntimeStatus>;
  getStatus(): SnapdragonRuntimeStatus;
  getCapabilities(): SnapdragonCapabilities;
  loadModel(modelId: string): Promise<boolean>;
  unloadModel(modelId: string): Promise<boolean>;
  generate(prompt: string, options?: any): Promise<string>;
  stream(prompt: string, onChunk: (chunk: string) => void): Promise<string>;
}
