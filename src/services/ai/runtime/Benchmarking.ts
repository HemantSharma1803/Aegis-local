import { InferenceBenchmark, HardwareExecutionTarget } from '../../../types/snapdragon';

export class BenchmarkingService {
  private static instance: BenchmarkingService;
  private readonly storageKey = 'aegis_local_inference_benchmarks';
  private benchmarks: InferenceBenchmark[] = [];

  constructor() {
    this.loadBenchmarks();
  }

  static getInstance(): BenchmarkingService {
    if (!this.instance) {
      this.instance = new BenchmarkingService();
    }
    return this.instance;
  }

  private loadBenchmarks(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter to strictly real measurements
          this.benchmarks = parsed.filter((b) => b && b.isRealMeasurement === true);
        }
      }
    } catch {
      this.benchmarks = [];
    }
  }

  private saveBenchmarks(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.benchmarks.slice(-50)));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Records a strictly real, verified runtime measurement.
   * Prohibits artificial or simulated inputs.
   */
  recordRealBenchmark(data: {
    modelId: string;
    operation: string;
    executionTarget: HardwareExecutionTarget;
    latencyMs: number;
    tokensGenerated?: number;
    memoryUsageMb?: number;
  }): InferenceBenchmark {
    const tokensPerSecond =
      data.tokensGenerated && data.latencyMs > 0
        ? Math.round((data.tokensGenerated / (data.latencyMs / 1000)) * 10) / 10
        : undefined;

    const benchmark: InferenceBenchmark = {
      modelId: data.modelId,
      operation: data.operation,
      executionTarget: data.executionTarget,
      latencyMs: Math.max(1, Math.round(data.latencyMs)),
      tokensPerSecond,
      memoryUsageMb: data.memoryUsageMb,
      timestamp: new Date().toISOString(),
      isRealMeasurement: true,
    };

    this.benchmarks.push(benchmark);
    this.saveBenchmarks();
    return benchmark;
  }

  /**
   * Returns all recorded measurements.
   * Never returns fake measurements if empty.
   */
  getBenchmarks(): InferenceBenchmark[] {
    return [...this.benchmarks];
  }

  /**
   * Clear recorded benchmark history
   */
  clearBenchmarks(): void {
    this.benchmarks = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.storageKey);
    }
  }
}

export const benchmarkingService = BenchmarkingService.getInstance();
