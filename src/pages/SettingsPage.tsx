import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Shield,
  Eye,
  Sliders,
  Check,
  Folder,
  AlertCircle,
  Sparkles,
  Lock,
  Layers,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { SnapdragonBadge } from '../components/ui/SnapdragonBadge';
import { SnapdragonRuntimePanel } from '../components/snapdragon/SnapdragonRuntimePanel';
import { useToast } from '../context/ToastContext';
import { useProject } from '../context/ProjectContext';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';
import { aiProviderRouter } from '../services/ai/AIProviderRouter';
import { PrivacyBoundary } from '../services/ai/privacy/PrivacyBoundary';
import {
  calculateStorageHealth,
  purgeOrphanedProjectData,
  StorageHealthReport,
  formatBytes,
} from '../services/storageService';
import { AIProviderStatus } from '../types/ai';

export const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { projects } = useProject();
  const [activeTab, setActiveTab] = useState('ai-provider');

  // AI Architecture Router State
  const [preferredProvider, setPreferredProvider] = useState<string>(
    aiProviderRouter.getPreferredProvider()
  );
  const [cloudOptIn, setCloudOptIn] = useState<boolean>(
    PrivacyBoundary.isCloudOptInAllowed()
  );
  const [providerStatuses, setProviderStatuses] = useState<AIProviderStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Other system preferences
  const [processingMode, setProcessingMode] = useState('balanced');
  const [storageDir, setStorageDir] = useState('C:\\Users\\User\\AppData\\Local\\AegisLocal');
  const [strictIsolation, setStrictIsolation] = useState(true);
  const [appearance, setAppearance] = useState('dark');
  const [storageHealth, setStorageHealth] = useState<StorageHealthReport | null>(null);

  const refreshStorageHealth = () => {
    const health = calculateStorageHealth(projects.map((p) => p.id));
    setStorageHealth(health);
  };

  useEffect(() => {
    refreshStorageHealth();
  }, [projects]);

  const settingsTabs = [
    { id: 'ai-provider', label: 'AI Architecture & Providers', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'snapdragon', label: 'Snapdragon & Local Runtime', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'processing', label: 'Processing & Power', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'storage', label: 'Storage Sandbox', icon: <HardDrive className="w-3.5 h-3.5" /> },
    { id: 'privacy', label: 'Privacy & Boundary', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  const loadStatuses = async () => {
    setIsRefreshing(true);
    try {
      const statuses = await aiProviderRegistry.getAllStatuses();
      setProviderStatuses(statuses);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const handleProviderSelect = (providerId: string) => {
    setPreferredProvider(providerId);
    aiProviderRouter.setPreferredProvider(providerId);
    toast.success(
      'AI Provider Selected',
      `Routing priority set to: ${
        providerId === 'auto' ? 'Automated Priority' : providerId
      }`
    );
  };

  const handleToggleCloudOptIn = (enabled: boolean) => {
    setCloudOptIn(enabled);
    PrivacyBoundary.setCloudOptInAllowed(enabled);
    loadStatuses();
    toast.info(
      enabled ? 'Cloud Fallback Enabled' : 'Cloud Fallback Blocked',
      enabled
        ? 'Server-side Gemini enclave will be queried when local inference runtimes are in standby.'
        : 'All external AI calls blocked. Application will operate strictly in offline/local-only mode.'
    );
  };

  const handleSave = () => {
    toast.success('Settings Saved', 'Local preferences updated for this desktop session.');
  };

  const getActiveStatusInfo = () => {
    const active = aiProviderRegistry.getActiveProvider();
    const stat = providerStatuses.find((s) => s.id === active.id);
    return { active, stat };
  };

  const { active, stat: currentActiveStatus } = getActiveStatusInfo();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Settings & AI Architecture
            </h1>
            <SnapdragonBadge isActive={false} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure local inference runtime, Qualcomm Snapdragon NPU integration, and privacy sandbox boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatuses}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Probe Hardware
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={settingsTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: AI Provider Architecture */}
      {activeTab === 'ai-provider' && (
        <div className="space-y-6">
          {/* Active Provider Overview Banner */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Active Execution Boundary
                </span>
                <Badge
                  variant={
                    currentActiveStatus?.processingLocation === 'Snapdragon NPU'
                      ? 'success'
                      : currentActiveStatus?.processingLocation === 'Local / On-device'
                      ? 'info'
                      : currentActiveStatus?.processingLocation === 'Cloud'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                  dot
                >
                  {currentActiveStatus?.processingLocation || 'Evaluating'}
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Target: {active.modelConfig.executionTarget}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Engine Name
                </span>
                <span className="text-zinc-200 font-medium">{active.name}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Model Spec
                </span>
                <span className="text-zinc-200 font-medium truncate block">
                  {active.modelConfig.displayName}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Hardware Allocation
                </span>
                <span className="text-zinc-200 font-medium truncate block">
                  {currentActiveStatus?.hardwareTarget || 'Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Fallback Opt-in Toggle */}
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <CardTitle>Cloud AI Fallback Policy</CardTitle>
                </div>
                <Badge variant={cloudOptIn ? 'info' : 'neutral'} size="sm">
                  {cloudOptIn ? 'Opt-In Active' : 'Strict Local Only'}
                </Badge>
              </div>
              <CardDescription>
                Explicit control over whether project tokens can be proxied to server-side AI when on-device inference is in standby
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="space-y-1 max-w-xl">
                  <span className="text-xs font-semibold text-zinc-200 block">
                    Allow Server-Side Gemini Enclave Queries
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    When enabled, Aegis Local proxies competition-grade reasoning requests to a server-side Gemini enclave. When disabled, cloud dispatch is blocked and private project text never leaves the computer.
                  </p>
                </div>
                <button
                  type="button"
                  id="cloud-optin-toggle"
                  onClick={() => handleToggleCloudOptIn(!cloudOptIn)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ml-4 ${
                    cloudOptIn ? 'bg-sky-500' : 'bg-zinc-700'
                  }`}
                  title="Toggle cloud fallback"
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      cloudOptIn ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Provider Selection Cards */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>Available AI Providers & Execution Targets</CardTitle>
              <CardDescription>
                Select a specific inference provider or let Aegis Local automatically prioritize hardware (Snapdragon NPU &gt; Local Host &gt; Cloud Enclave)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto Option */}
              <div
                id="provider-card-auto"
                onClick={() => handleProviderSelect('auto')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  preferredProvider === 'auto'
                    ? 'bg-zinc-800/90 border-sky-500 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-semibold text-zinc-100">
                      Automated Hardware Router (Recommended)
                    </span>
                  </div>
                  <Badge variant={preferredProvider === 'auto' ? 'info' : 'neutral'} size="sm">
                    {preferredProvider === 'auto' ? 'Active Priority' : 'Auto'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400">
                  Automatically prioritizes Qualcomm Snapdragon Hexagon NPU on ARM64 Windows devices, falls back to on-device CPU/GPU host runtime, and utilizes the server enclave only when authorized.
                </p>
              </div>

              {/* Provider List */}
              {aiProviderRegistry.getAllProviders().map((prov) => {
                const isSelected = preferredProvider === prov.id;
                const status = providerStatuses.find((s) => s.id === prov.id);
                const isAvailable = status?.available ?? false;

                return (
                  <div
                    key={prov.id}
                    id={`provider-card-${prov.id}`}
                    onClick={() => handleProviderSelect(prov.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-zinc-400 shadow-sm'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className={`w-4 h-4 ${isAvailable ? 'text-emerald-400' : 'text-zinc-400'}`} />
                        <span className="text-xs font-semibold text-zinc-200">
                          {prov.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isAvailable ? 'success' : 'neutral'}
                          size="sm"
                          dot={isAvailable}
                        >
                          {isAvailable
                            ? status?.processingLocation || 'Operational'
                            : 'Standby / Unconfigured'}
                        </Badge>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 mb-3">
                      {status?.message || prov.modelConfig.notes}
                    </p>

                    {/* Hardware & Target Specs */}
                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/70 text-[11px] space-y-1 font-mono">
                      <div className="flex justify-between text-zinc-400">
                        <span>Execution Target:</span>
                        <span className="text-zinc-300">{prov.modelConfig.executionTarget}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Model Spec:</span>
                        <span className="text-zinc-300">{prov.modelConfig.displayName}</span>
                      </div>
                      {prov.modelConfig.recommendedHardware && (
                        <div className="flex justify-between text-zinc-400">
                          <span>Target Hardware:</span>
                          <span className="text-zinc-300">{prov.modelConfig.recommendedHardware}</span>
                        </div>
                      )}
                    </div>

                    {/* Capabilities Tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span className="text-zinc-500 mr-1">Capabilities:</span>
                      {prov.capabilities.textGeneration && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          Text Generation
                        </span>
                      )}
                      {prov.capabilities.streaming && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          Streaming
                        </span>
                      )}
                      {prov.capabilities.structuredJson && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          Structured JSON
                        </span>
                      )}
                      {prov.capabilities.embeddings && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          Embeddings
                        </span>
                      )}
                      {prov.capabilities.speech && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          Speech Inference
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          prov.capabilities.isLocal
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {prov.capabilities.isLocal ? 'On-Device' : 'Remote API'}
                      </span>
                    </div>

                    {/* Missing Requirements List when unconfigured */}
                    {!isAvailable && status?.missingRequirements && status.missingRequirements.length > 0 && (
                      <div className="mt-3 p-2.5 rounded bg-zinc-950/80 border border-zinc-800/80 text-[11px] space-y-1">
                        <span className="text-zinc-400 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                          Requirements to activate on this machine:
                        </span>
                        <ul className="list-disc pl-5 text-zinc-400 space-y-0.5">
                          {status.missingRequirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Snapdragon & Local Runtime */}
      {activeTab === 'snapdragon' && (
        <SnapdragonRuntimePanel />
      )}

      {/* Tab 2: Processing Mode */}
      {activeTab === 'processing' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Processing Mode & Thermal Profile</CardTitle>
            <CardDescription>
              Adjust compute throughput versus energy consumption on Windows laptops
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: 'balanced',
                title: 'Balanced (Standard)',
                desc: 'Optimized response latency without aggressive fan spin or thermal throttling.',
              },
              {
                id: 'high-performance',
                title: 'High Performance',
                desc: 'Maximized prompt ingestion speeds, higher thread allocation during Judge Mode.',
              },
              {
                id: 'low-power',
                title: 'Low Power / Battery Saver',
                desc: 'Limits background indexing, throttles token output to maintain device longevity on battery power.',
              },
            ].map((mode) => {
              const isSelected = processingMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setProcessingMode(mode.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/80 border-zinc-400'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      {mode.title}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{mode.desc}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Storage */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Local Storage & Sandbox Directory</CardTitle>
                  <CardDescription>
                    Location where project knowledge chunks, transcripts, and staged documents reside
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshStorageHealth}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Refresh Health
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Windows App Data Root</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={storageDir}
                    onChange={(e) => setStorageDir(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 focus:border-zinc-600 outline-none"
                  />
                  <Button variant="outline" size="sm" icon={<Folder className="w-3.5 h-3.5" />}>
                    Browse
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
                <span>All caches, transcripts, and staged files are uncompressed SQLite / flat JSON stores within user profile sandbox.</span>
              </div>
            </CardContent>
          </Card>

          {/* Storage Quota & Health Inspector */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>Storage Health & Quota Inspector</CardTitle>
              <CardDescription>
                Live accounting of browser and on-device sandbox storage utilization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageHealth && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800">
                      <div className="text-[11px] text-zinc-500 font-medium">Total Consumed</div>
                      <div className="text-base font-semibold text-zinc-100 mt-0.5">
                        {storageHealth.formattedTotal}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        {storageHealth.itemCount} storage keys recorded
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800">
                      <div className="text-[11px] text-zinc-500 font-medium">Quota Health</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            storageHealth.quotaWarning ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-xs font-semibold text-zinc-200">
                          {storageHealth.quotaWarning ? 'Approaching Quota' : 'Healthy (<4 MB)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        Browser limit ~5–10 MB
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800">
                      <div className="text-[11px] text-zinc-500 font-medium">Orphaned Data</div>
                      <div className="text-base font-semibold text-zinc-100 mt-0.5">
                        {storageHealth.orphanedKeysCount === 0 ? '0 Keys' : `${storageHealth.orphanedKeysCount} Keys`}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        {storageHealth.orphanedKeysCount === 0
                          ? 'Zero unlinked project records'
                          : 'Remnants from deleted projects'}
                      </div>
                    </div>
                  </div>

                  {/* Storage Category Breakdown */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-medium text-zinc-300">Category Breakdown</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px]">Projects</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">
                          {formatBytes(storageHealth.categories.projects.bytes)}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {storageHealth.categories.projects.count} manifest
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px]">Staged Files</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">
                          {formatBytes(storageHealth.categories.files.bytes)}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {storageHealth.categories.files.count} manifests
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px]">Knowledge Chunks</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">
                          {formatBytes(storageHealth.categories.knowledge.bytes)}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {storageHealth.categories.knowledge.count} indices
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px]">Judge & Voice</span>
                        <span className="font-semibold text-zinc-200 mt-0.5 block">
                          {formatBytes(
                            storageHealth.categories.judgeSessions.bytes +
                              storageHealth.categories.voiceSessions.bytes
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {storageHealth.categories.judgeSessions.count +
                            storageHealth.categories.voiceSessions.count}{' '}
                          sessions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const purged = purgeOrphanedProjectData(projects.map((p) => p.id));
                        refreshStorageHealth();
                        if (purged > 0) {
                          toast.success('Storage Purged', `Cleaned up ${purged} orphaned project keys.`);
                        } else {
                          toast.info('Storage Clean', 'No orphaned project keys found.');
                        }
                      }}
                    >
                      Clean Orphaned Records
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Privacy */}
      {activeTab === 'privacy' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Privacy & Sandbox Security</CardTitle>
            <CardDescription>
              Enforce local perimeter restrictions and prevent external leaks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-zinc-200">
                  Strict Context Isolation
                </span>
                <p className="text-[11px] text-zinc-400">
                  Prevent project knowledge index from interacting with global operating system search or telemetry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStrictIsolation(!strictIsolation)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  strictIsolation ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    strictIsolation ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-zinc-200">
                  Anonymous Crash Telemetry
                </span>
                <p className="text-[11px] text-zinc-400">
                  Disabled by default. Aegis transmits zero unsolicited analytics.
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                Disabled
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Appearance */}
      {activeTab === 'appearance' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Application Appearance</CardTitle>
            <CardDescription>Visual theme and presentation typography density</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'dark', title: 'Dark First (Recommended)', desc: 'High-contrast charcoal & emerald theme optimized for deep focus.' },
              { id: 'system', title: 'System Default', desc: 'Syncs with Windows 11 accent and frame preferences.' },
              { id: 'compact', title: 'Compact Desktop Density', desc: 'Tighter row padding and smaller typography for technical inspections.' },
            ].map((theme) => {
              const isSelected = appearance === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setAppearance(theme.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/80 border-zinc-400'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">{theme.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{theme.desc}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
