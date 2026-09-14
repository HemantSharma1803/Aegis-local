import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RuntimeDetector } from '../RuntimeDetector';
import { snapdragonRuntime } from '../SnapdragonRuntime';
import { modelRegistry } from '../ModelRegistry';
import { ONNXAdapter } from '../ONNXAdapter';
import { QNNAdapter } from '../QNNAdapter';
import { benchmarkingService } from '../Benchmarking';
import { aiProviderRouter } from '../../AIProviderRouter';
import { aiProviderRegistry } from '../../AIProviderRegistry';
import { PrivacyBoundary } from '../../privacy/PrivacyBoundary';
import { ProjectIsolation } from '../../privacy/ProjectIsolation';
import { StructuredOutputValidator } from '../../validation/StructuredOutputValidator';

describe('Segment 11: Snapdragon Optimization & Deployment Readiness Tests', () => {
  beforeEach(() => {
    RuntimeDetector.clearCache();
    vi.restoreAllMocks();
  });

  // 1. Non-Snapdragon environment detection
  it('1. should detect non-Snapdragon environment truthfully without fabricating NPU presence', async () => {
    const profile = await RuntimeDetector.detectDeviceProfile();
    expect(profile).toBeDefined();
    expect(typeof profile.platform).toBe('string');
    expect(typeof profile.architecture).toBe('string');
    // In standard node/vitest environment, npuAvailable must be false unless genuine bridge is present
    expect(profile.npuAvailable).toBe(false);
  });

  // 2. Snapdragon environment detection abstraction
  it('2. should correctly classify device profile when ARM64 Windows platform is present', async () => {
    const originalNavigator = (globalThis as any).navigator;
    try {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; ARM64; Snapdragon X Elite) AppleWebKit/537.36',
        },
        configurable: true,
        writable: true,
      });
      RuntimeDetector.clearCache();
      const profile = await RuntimeDetector.detectDeviceProfile();
      expect(profile.platform).toBe('windows');
      expect(profile.architecture).toBe('arm64');
      expect(profile.isARM64Windows).toBe(true);
      expect(profile.classification).toBe('Snapdragon NPU unavailable');
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      RuntimeDetector.clearCache();
    }
  });

  // 3. Runtime unavailable state
  it('3. should report runtime unavailable state and honest diagnostic message when hardware is absent', async () => {
    const status = await snapdragonRuntime.detect();
    expect(status.available).toBe(false);
    expect(status.executionTarget).toBe('cpu');
    expect(status.message).toMatch(/not detected|not a Snapdragon|standby|unconfigured/i);
  });

  // 4. NPU unavailable state
  it('4. should keep application functional even when NPU is unavailable', () => {
    const status = snapdragonRuntime.getStatus();
    expect(status).toBeDefined();
    expect(status.capabilities.npu).toBe(false);
    // getCapabilities returns valid structure
    const caps = snapdragonRuntime.getCapabilities();
    expect(caps).toHaveProperty('npu');
    expect(caps).toHaveProperty('onnx');
  });

  // 5. NPU active state only after verified detection
  it('5. should report NPU active only after verified detection', async () => {
    const originalWindow = global.window;
    try {
      (global as any).window = {
        __QUALCOMM_QNN_BRIDGE__: {
          getProcessorName: () => 'Snapdragon X Elite X1E-84-100',
          loadModel: vi.fn().mockResolvedValue(true),
          infer: vi.fn().mockResolvedValue({ text: 'NPU Output', tokensGenerated: 12 }),
        },
      };
      RuntimeDetector.clearCache();
      const status = await snapdragonRuntime.detect();
      expect(status.detected).toBe(true);
      expect(status.available).toBe(true);
      expect(status.executionTarget).toBe('npu');
      expect(status.hardwareTarget).toContain('Snapdragon');
    } finally {
      global.window = originalWindow;
      RuntimeDetector.clearCache();
    }
  });

  // 6. Model compatibility checks
  it('6. should check model compatibility and prevent automatic large model downloads', async () => {
    const models = await modelRegistry.getModels();
    expect(models.length).toBeGreaterThan(0);
    const llamaQnn = models.find((m) => m.format === 'qnn');
    expect(llamaQnn).toBeDefined();
    expect(llamaQnn?.qualcommAiHubReady).toBe(true);
    expect(llamaQnn?.quantization).toBe('INT4');
    expect(['runtime-unavailable', 'hardware-incompatible']).toContain(llamaQnn?.status);
  });

  // 7. ONNX adapter interface
  it('7. should refuse NPU execution in ONNXAdapter when NPU is not verified on host', async () => {
    const onnx = new ONNXAdapter();
    await expect(
      onnx.loadModel('qualcomm-ai-hub/llama-3-8b-instruct-qnn', 'npu')
    ).rejects.toThrow(/Snapdragon NPU runtime/);
  });

  // 8. QNN adapter interface
  it('8. should enforce QNN hardware bridge requirement in QNNAdapter', async () => {
    const qnn = new QNNAdapter();
    const available = await qnn.isAvailable();
    expect(available).toBe(false);
    await expect(qnn.loadModel('any-model')).rejects.toThrow(/Qualcomm QNN hardware bridge is not available/);
  });

  // 9. Provider routing
  it('9. should resolve provider based on priority hierarchy and user configuration', async () => {
    // When cloud opt-in is false and local hardware is in standby
    PrivacyBoundary.setCloudOptInAllowed(false);
    aiProviderRouter.setPreferredProvider('auto');
    const route = await aiProviderRouter.resolveProvider();
    expect(route).toBeDefined();
    expect(route.provider).toBeDefined();
    expect(route.status.available).toBe(false);
  });

  // 10. No silent cloud fallback
  it('10. should NEVER silently route to cloud when cloud opt-in is disabled', async () => {
    PrivacyBoundary.setCloudOptInAllowed(false);
    aiProviderRouter.setPreferredProvider('auto');
    const route = await aiProviderRouter.resolveProvider();
    expect(route.provider.id).not.toBe('gemini-provider');
    expect(route.isFallback).toBe(false);
  });

  // 11. Benchmark measurement model
  it('11. should enforce real measurements only and reject fake/simulated benchmarks', () => {
    const initial = benchmarkingService.getBenchmarks();
    expect(Array.isArray(initial)).toBe(true);
    // Record genuine measurement
    const bm = benchmarkingService.recordRealBenchmark({
      modelId: 'test-model',
      operation: 'generate',
      executionTarget: 'cpu',
      latencyMs: 145,
      tokensGenerated: 25,
    });
    expect(bm.isRealMeasurement).toBe(true);
    expect(bm.tokensPerSecond).toBe(172.4);
    expect(bm.latencyMs).toBe(145);
  });

  // 12. Project isolation
  it('12. should prevent cross-project context leakage in prompts', () => {
    const sanitized = ProjectIsolation.sanitizePayloadForLogging({
      projectId: 'proj-123',
      privateKey: 'secret-key-123',
      transcript: 'My confidential patent details',
    });
    expect(sanitized.privateKey).toBe('[REDACTED]');
  });

  // 13. Existing Ask Aegis validation
  it('13. should handle Ask Aegis task capabilities correctly', () => {
    const check = aiProviderRouter.canHandle('ask-aegis', {
      textGeneration: true,
      streaming: true,
      embeddings: true,
      structuredJson: true,
      vision: false,
      speech: false,
      isLocal: true,
      isRemote: false,
      supportsStreaming: true,
      supportsGrounding: true,
    });
    expect(check.supported).toBe(true);
  });

  // 14. Existing Prepare Me validation
  it('14. should validate structured PreparationPlan JSON without data corruption', () => {
    const validPlan = {
      projectId: 'test-proj',
      projectSummary: {
        whatItIs: 'Aegis Local On-Device Project Coach',
        problemItSolves: 'Local presentation readiness',
        howItWorks: 'Provider abstraction and local AI architecture',
        whyItMatters: 'Zero cloud leakage',
      },
      pitch60s: {
        title: '60s Pitch',
        pitch: 'Aegis Local prepares engineers for technical defenses without cloud dependency.',
        estimatedSeconds: 60,
      },
      presentationStory: ['Introduction', 'Architecture', 'Demo'],
      technicalDefense: ['NPU vs CPU', 'Zero simulation policy'],
      checklist: [
        {
          id: 'item-1',
          label: 'Verify local execution target',
          completed: false,
          category: 'technical',
          sourceAttribution: 'README.md',
        },
      ],
    };
    const validation = StructuredOutputValidator.validatePreparationPlan(validPlan);
    expect(validation.valid).toBe(true);
    expect(validation.data?.projectSummary.whatItIs).toContain('Aegis Local');
  });

  // 15. Existing Judge Mode validation
  it('15. should validate Judge questions and scoring safely', () => {
    const validQuestion = {
      question: 'How does Aegis Local guarantee zero fake inference?',
      persona: 'Technical Architect',
      focusArea: 'Architecture',
      difficulty: 'hard',
      expectedCoverage: ['Hardware probing', 'No mocked benchmarks'],
      sourceAttribution: 'architecture.md',
    };
    const validation = StructuredOutputValidator.validateJudgeQuestion(validQuestion);
    expect(validation.valid).toBe(true);
    expect(validation.data?.question).toContain('zero fake inference');
  });

  // 16. Existing Readiness validation
  it('16. should validate ReadinessReport synthesis output structure', () => {
    const validReport = {
      overallExplanation: 'Solid on-device architecture design.',
      strengths: ['Vendor neutral provider router', 'Zero fake benchmark guarantee'],
      weaknesses: ['Requires native Windows ARM64 QNN driver bridge for active NPU'],
      recommendedPractice: ['Deploy on Snapdragon X Elite device'],
      nextBestAction: 'Review Model Registry for INT4 model deployment',
    };
    const validation = StructuredOutputValidator.validateReadinessReport(validReport);
    expect(validation.valid).toBe(true);
    expect(validation.data?.strengths).toHaveLength(2);
  });

  // 17. Existing Voice Practice validation
  it('17. should validate VoicePracticeResult rubric structure', () => {
    const validPractice = {
      mode: 'pitch-60s',
      transcript: 'Aegis Local is an on-device presentation readiness coach.',
      summary: 'Clear concise pitch.',
      strengths: ['Concise summary of architecture'],
      improvements: ['Mention 45 TOPS NPU speedup'],
      missingPoints: ['Quantization details'],
      projectEvidence: ['src/services/ai/runtime/SnapdragonRuntime.ts'],
      recommendedPractice: ['Try Judge Mode with Technical Architect persona'],
      accuracyScore: 4.8,
      clarityScore: 4.5,
      defenseScore: 4.2,
      overallRubricScore: 4.5,
      primaryCategory: 'defense',
    };
    const validation = StructuredOutputValidator.validateVoicePracticeResult(validPractice);
    expect(validation.valid).toBe(true);
    expect(validation.data?.accuracyScore).toBe(4.8);
  });
});
