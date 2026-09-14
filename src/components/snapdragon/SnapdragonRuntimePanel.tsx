import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Shield,
  Layers,
  HardDrive,
  Activity,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  RefreshCw,
  Box,
  Microchip,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { snapdragonRuntime } from '../../services/ai/runtime/SnapdragonRuntime';
import { RuntimeDetector } from '../../services/ai/runtime/RuntimeDetector';
import { modelRegistry } from '../../services/ai/runtime/ModelRegistry';
import { benchmarkingService } from '../../services/ai/runtime/Benchmarking';
import {
  SnapdragonRuntimeStatus,
  DeviceProfile,
  OptimizedModel,
  InferenceBenchmark,
} from '../../types/snapdragon';

export const SnapdragonRuntimePanel: React.FC = () => {
  const [status, setStatus] = useState<SnapdragonRuntimeStatus>(snapdragonRuntime.getStatus());
  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [models, setModels] = useState<OptimizedModel[]>([]);
  const [benchmarks, setBenchmarks] = useState<InferenceBenchmark[]>([]);
  const [isProbing, setIsProbing] = useState(false);

  const probe = async () => {
    setIsProbing(true);
    try {
      RuntimeDetector.clearCache();
      const detectedProfile = await RuntimeDetector.detectDeviceProfile();
      setProfile(detectedProfile);

      const detectedStatus = await snapdragonRuntime.detect();
      setStatus(detectedStatus);

      const registeredModels = await modelRegistry.getModels();
      setModels(registeredModels);

      setBenchmarks(benchmarkingService.getBenchmarks());
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    probe();
  }, []);

  // Determine truthful runtime state label
  const getTruthfulState = () => {
    if (status.detected && status.available) {
      return {
        label: 'Snapdragon NPU active',
        variant: 'success' as const,
        description: 'Qualcomm Hexagon NPU hardware accelerator is verified and running on this device.',
      };
    }
    if (profile?.classification === 'Non-Snapdragon Windows') {
      return {
        label: 'Snapdragon runtime not detected',
        variant: 'neutral' as const,
        description: 'Standard Windows x86_64 host detected. Snapdragon ARM64 Hexagon NPU is not present.',
      };
    }
    if (profile?.isARM64Windows) {
      return {
        label: 'Snapdragon-ready architecture',
        variant: 'info' as const,
        description: 'Windows ARM64 architecture detected. Qualcomm AI Engine driver bridge is currently in standby.',
      };
    }
    return {
      label: 'Snapdragon-ready architecture',
      variant: 'info' as const,
      description: 'The local AI architecture is ready for Qualcomm AI Engine and ONNX Runtime deployment.',
    };
  };

  const truthfulState = getTruthfulState();

  return (
    <div className="space-y-6 select-none">
      {/* 1. Competition-Facing Technical Explanation Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/30 to-zinc-900 border border-sky-900/40 text-xs space-y-2">
        <div className="flex items-center gap-2 text-sky-400 font-semibold font-mono">
          <Info className="w-4 h-4" />
          <span>Competition Architecture Brief</span>
        </div>
        <p className="text-zinc-300 leading-relaxed text-[12px]">
          &ldquo;Aegis Local separates application intelligence from inference hardware through a provider and runtime abstraction. This allows the same private project workflow to use a local runtime today and Snapdragon-optimized NPU inference when deployed to compatible Snapdragon Windows hardware.&rdquo;
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            Zero Fake Inference Guarantee
          </span>
          <span>&bull;</span>
          <span>Target: 45 TOPS Hexagon NPU</span>
          <span>&bull;</span>
          <span>Format: QNN / ONNX DirectML</span>
        </div>
      </div>

      {/* 2. Snapdragon Demo Status Card */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <CardTitle>Snapdragon Demo Status</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={probe}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />}
            >
              Probe Hardware
            </Button>
          </div>
          <CardDescription>
            Live hardware probe of host device and Qualcomm AI Engine execution boundary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                Current Environment
              </span>
              <span className="text-zinc-200 font-semibold mt-0.5 block">
                Development Environment
              </span>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                {profile?.platform || 'Web/Container'} ({profile?.architecture || 'x86_64'})
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                Target Deployment
              </span>
              <span className="text-zinc-200 font-semibold mt-0.5 block">
                Snapdragon-powered PC
              </span>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                Windows 11 ARM64 (45 TOPS)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                Optimization Path
              </span>
              <span className="text-zinc-200 font-semibold mt-0.5 block">
                ONNX / QNN / AI Hub
              </span>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                INT4 / INT8 Quantized
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                Execution Status
              </span>
              <div className="mt-0.5">
                <Badge variant={truthfulState.variant} size="sm" dot>
                  {truthfulState.label}
                </Badge>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {status.detected ? 'Verified NPU Active' : 'Not detected in current environment'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-zinc-300">Honest Evaluation: </span>
              {truthfulState.description}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Technical Capabilities & Device Profile */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <CardTitle>Host Device Profile & Runtime Boundary</CardTitle>
          </div>
          <CardDescription>
            Detailed runtime discovery and execution provider matrix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 block font-mono">Platform</span>
              <span className="font-semibold text-zinc-200 mt-0.5 block capitalize">
                {profile?.platform || 'Unknown'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 block font-mono">Architecture</span>
              <span className="font-semibold text-zinc-200 mt-0.5 block font-mono">
                {profile?.architecture || 'Unknown'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 block font-mono">Hexagon NPU</span>
              <span className={`font-semibold mt-0.5 block ${status.capabilities.npu ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {status.capabilities.npu ? 'Active' : 'Standby'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 block font-mono">ONNX Runtime</span>
              <span className={`font-semibold mt-0.5 block ${status.capabilities.onnx ? 'text-sky-400' : 'text-zinc-400'}`}>
                {status.capabilities.onnx ? 'Ready' : 'Not Loaded'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 block font-mono">QNN Adapter</span>
              <span className={`font-semibold mt-0.5 block ${status.capabilities.qnn ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {status.capabilities.qnn ? 'Connected' : 'Standby'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-[10px] text-zinc-500 block font-mono">Quantization</span>
              <span className="font-semibold text-zinc-200 mt-0.5 block font-mono">
                INT4 / INT8
              </span>
            </div>
          </div>

          {/* Technical Details Area when capabilities detected */}
          {status.capabilities.npu && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Snapdragon Hexagon NPU Driver Connected</span>
              </div>
              <p className="text-zinc-300 text-[11px]">
                Active DirectML / QNN Execution Provider detected. Local model inference runs entirely on the 45 TOPS NPU without waking host CPU cores.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Model Registry & Qualcomm AI Hub Readiness */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-sky-400" />
              <CardTitle>Model Registry & Qualcomm AI Hub Readiness</CardTitle>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {models.length} Architecture Profiles
            </span>
          </div>
          <CardDescription>
            Designed for integration with Qualcomm AI Hub optimized models. No weights are downloaded automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {models.map((model) => (
            <div
              key={model.modelId}
              className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100">{model.displayName}</span>
                  {model.qualcommAiHubReady && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/50 text-[10px] font-mono">
                      AI Hub Ready
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                    {model.format.toUpperCase()}
                  </span>
                  {model.quantization && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[10px]">
                      {model.quantization}
                    </span>
                  )}
                  <Badge
                    variant={
                      model.status === 'available'
                        ? 'success'
                        : model.status === 'configured'
                        ? 'info'
                        : model.status === 'download-required'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {model.status === 'runtime-unavailable'
                      ? 'Runtime Standby'
                      : model.status === 'hardware-incompatible'
                      ? 'NPU Required'
                      : model.status}
                  </Badge>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400">{model.notes}</p>

              <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                <span>Task: {model.task}</span>
                <span>Context: {model.contextLength} tokens</span>
                {model.sizeMb && <span>Budget: {model.sizeMb} MB</span>}
                <span>Targets: {model.executionTargets.join(', ').toUpperCase()}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 5. Inference Benchmarking & Hardware Telemetry */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <CardTitle>Inference Benchmarking & Hardware Telemetry</CardTitle>
          </div>
          <CardDescription>
            Real latency and throughput telemetry. Aegis Local never generates simulated benchmark numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {benchmarks.length === 0 ? (
            <div className="p-6 rounded-xl bg-zinc-950/40 border border-zinc-800/70 text-center space-y-2">
              <Clock className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-300 font-medium">
                No local benchmark measurements recorded yet
              </p>
              <p className="text-[11px] text-zinc-500 max-w-md mx-auto leading-relaxed">
                Benchmarks are strictly populated from actual runtime executions when local ONNX or Snapdragon NPU models are invoked. Aegis Local adheres to a zero-simulation policy.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {benchmarks.slice(-5).map((bm, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="text-zinc-200 font-semibold">{bm.modelId}</span>
                    <span className="text-zinc-500 text-[10px] block">
                      {bm.operation} &bull; Target: {bm.executionTarget.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-semibold">{bm.latencyMs} ms</span>
                    {bm.tokensPerSecond && (
                      <span className="text-zinc-400 text-[10px] block">
                        {bm.tokensPerSecond} tok/s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
