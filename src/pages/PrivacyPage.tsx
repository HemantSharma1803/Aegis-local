import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Cpu,
  Mic,
  CloudOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  ArrowRight,
  Database,
  Radio,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SnapdragonBadge } from '../components/ui/SnapdragonBadge';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';
import { PrivacyBoundary } from '../services/ai/privacy/PrivacyBoundary';
import { AIProviderStatus } from '../types/ai';

export const PrivacyPage: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<AIProviderStatus | null>(null);
  const cloudAllowed = PrivacyBoundary.isCloudOptInAllowed();

  useEffect(() => {
    aiProviderRegistry.getActiveStatus().then(setActiveStatus).catch(() => null);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Privacy Architecture & Data Sovereignty
            </h1>
          </div>
          <SnapdragonBadge isActive={activeStatus?.processingLocation === 'Snapdragon NPU'} />
        </div>
        <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
          Aegis Local is built on local-first project context and rigorous processing transparency. We never make exaggerated or misleading claims about offline AI; every data boundary and runtime location is explicitly documented below.
        </p>
      </div>

      {/* 5 Core Privacy Inquiries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Inquiry 1: What stays on this device? */}
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <CardTitle>1. What stays on this device?</CardTitle>
              </div>
              <Badge variant="success" size="sm" dot>
                100% On-Device
              </Badge>
            </div>
            <CardDescription>
              Local project repository, staged documents, and structured knowledge index
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your raw project documents, slide decks, architectural whitepapers, and notes remain stored in your local browser sandbox and client-side storage.
            </p>
            <div className="space-y-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Extracted technical concepts, structured facts, and project evidence remain in your browser sandbox.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Practice checklists, session transcripts, and judge history never sync to external clouds.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Files are never uploaded for third-party foundation model training.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inquiry 2: What can be sent to an AI provider? */}
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <CardTitle>2. What can be sent to an AI provider?</CardTitle>
              </div>
              <Badge variant="info" size="sm">
                Project-Scoped Only
              </Badge>
            </div>
            <CardDescription>
              Explicit prompt payloads and relevant grounding excerpts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed">
              When an AI query is triggered (such as an Ask Aegis question, a Judge simulation, or a Voice Practice critique), Aegis Local constructs a focused, sanitized context payload:
            </p>
            <div className="space-y-1.5 text-[11px] text-zinc-400">
              <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80 font-mono">
                Payload = [Active Project Summary + Relevant Snippets + Specific User Question]
              </div>
              <div className="flex items-center gap-2 text-zinc-300 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Never whole-folder binary uploads; strictly excerpted text needed for the prompt.</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Strict project isolation: context from other projects is never mixed or leaked.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inquiry 3: Where does AI processing happen? */}
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <CardTitle>3. Where does AI processing happen?</CardTitle>
              </div>
              <Badge
                variant={
                  activeStatus?.processingLocation === 'Snapdragon NPU'
                    ? 'success'
                    : activeStatus?.processingLocation === 'Local / On-device'
                    ? 'info'
                    : activeStatus?.processingLocation === 'Cloud'
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
                dot
              >
                {activeStatus?.processingLocation || 'Inspecting'}
              </Badge>
            </div>
            <CardDescription>
              Observable runtime location based on configured hardware
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-300 font-mono">Current Location:</span>
              <span className="font-semibold text-zinc-100">
                {activeStatus?.processingLocation || 'Evaluating runtime'}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Processing location is strictly transparent:
            </p>
            <ul className="text-[11px] text-zinc-400 space-y-1 pl-4 list-disc">
              <li>
                <strong>Snapdragon NPU:</strong> When deployed on Qualcomm Snapdragon X Elite / Plus hardware with QNN bindings, inference runs 100% on the local 45 TOPS Hexagon NPU.
              </li>
              <li>
                <strong>Local / On-device:</strong> When connected to a local GGUF/ONNX host daemon (e.g. Llama.cpp), tokens are computed on local CPU/GPU.
              </li>
              <li>
                <strong>Cloud (Server-Side Enclave):</strong> When cloud fallback is enabled, requests are processed via a server-side Gemini proxy to safeguard API keys.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Inquiry 4: Is raw audio stored? */}
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <CardTitle>4. Is raw audio stored?</CardTitle>
              </div>
              <Badge variant="success" size="sm" dot>
                Never Persisted
              </Badge>
            </div>
            <CardDescription>
              Microphone recordings and verbal pitch practice processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong>No raw audio is ever persisted or saved to disk.</strong> When practicing your verbal pitch:
            </p>
            <div className="space-y-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Audio stream is converted to text via local browser / OS Web Speech API in real-time.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Audio buffers are released from memory the moment recording stops.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Only the user-confirmed transcript text is saved to your local preparation ledger.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inquiry 5: Full Width Card - What happens when no local provider is available? */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-amber-400" />
              <CardTitle>5. What happens when no local provider is available?</CardTitle>
            </div>
            <Badge variant={cloudAllowed ? 'info' : 'warning'} size="sm">
              {cloudAllowed ? 'Explicit Opt-In Active' : 'Strict Local Mode'}
            </Badge>
          </div>
          <CardDescription>
            Deterministic degradation behavior, offline resilience, and zero silent cloud fallback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-2">
              <span className="font-semibold text-zinc-200 block">
                No Silent Cloud Fallback
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Aegis Local will NEVER silently transmit your private files to a remote server. If on-device inference is in standby, and cloud fallback is toggled OFF in Settings, the AI features clearly state &quot;AI runtime unavailable&quot; rather than executing covert network calls.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-2">
              <span className="font-semibold text-zinc-200 block">
                Offline Application Sovereignty
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                The application does not break when AI is unavailable. Project knowledge management, document extraction, 60-second preparation checklists, scoring rubrics, readiness evidence, and transcripts remain fully usable offline.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>You can adjust the Cloud AI Fallback Policy anytime in Settings.</span>
            </div>
            <a
              href="/settings"
              className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 text-[11px]"
            >
              Open Settings <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Trust & Transparency Note */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 flex items-start gap-3 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Engineering Principle:</strong> Aegis Local distinguishes between architectural readiness and active runtime execution. We do not claim &quot;active on-device Snapdragon inference&quot; unless genuine QNN bindings or NPU services are detected on your system.
        </p>
      </div>
    </div>
  );
};
