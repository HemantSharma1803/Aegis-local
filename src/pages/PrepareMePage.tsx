import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FolderOpen,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  History,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BookmarkPlus,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import {
  PreparationPlan,
  PreparationPreferences,
  PreparationChecklistItem,
} from '../types/prepare';
import { PreparationSetupPanel } from '../components/prepare/PreparationSetupPanel';
import { PreparationPlanViewer } from '../components/prepare/PreparationPlanViewer';
import { preparationPlanRepository } from '../services/prepare/PreparationPlanRepository';
import { PreparationContextBuilder } from '../services/prepare/PreparationContextBuilder';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';
import { aiProviderRouter } from '../services/ai/AIProviderRouter';
import { SnapdragonBadge } from '../components/ui/SnapdragonBadge';


interface PrepareMePageProps {
  onOpenImportModal: () => void;
  onNavigateToJudge?: () => void;
  onNavigateToProject?: () => void;
  onNavigateToSettings?: () => void;
}

export const PrepareMePage: React.FC<PrepareMePageProps> = ({
  onOpenImportModal,
  onNavigateToJudge,
  onNavigateToProject,
  onNavigateToSettings,
}) => {
  const { activeProject, hasProject, loadDemoProject, projectContextData } = useProject();
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<PreparationPreferences>({
    goal: 'Competition',
    difficulty: 'Technical',
    focusAreas: ['Architecture', 'Technology Choices', 'Security', 'Potential Questions'],
    sessionPreference: 'Standard',
  });

  const [activePlan, setActivePlan] = useState<PreparationPlan | null>(null);
  const [plansHistory, setPlansHistory] = useState<PreparationPlan[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [providerAvailable, setProviderAvailable] = useState<boolean | null>(null);
  const [activeProviderName, setActiveProviderName] = useState<string>('Google Gemini');
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);

  // Load project-scoped plans on active project change
  useEffect(() => {
    if (activeProject) {
      const history = preparationPlanRepository.getPlans(activeProject.id);
      setPlansHistory(history);
      setActivePlan(history.length > 0 ? history[0] : null);
      setGenerationError(null);
    } else {
      setPlansHistory([]);
      setActivePlan(null);
    }
  }, [activeProject?.id]);

  // Check provider availability
  useEffect(() => {
    const checkProvider = async () => {
      const provider = aiProviderRegistry.getActiveProvider();
      setActiveProviderName(provider.name);
      setIsLocalMode(provider.capabilities.isLocal);
      const available = await provider.isAvailable();
      setProviderAvailable(available);
    };
    checkProvider();
  }, []);

  const handleBuildPlan = async () => {
    if (!activeProject) {
      toast.warning('Project Required', 'Open a project before building a preparation plan.');
      return;
    }

    if (!projectContextData.hasExtractedKnowledge && (!activeProject.files || activeProject.files.length === 0)) {
      toast.warning('Empty Context', 'Add project material before preparing.');
      return;
    }

    const provider = aiProviderRegistry.getActiveProvider();
    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      setProviderAvailable(false);
      setGenerationError(
        'AI provider not configured. Please configure your GEMINI_API_KEY in Settings to enable project preparation.'
      );
      toast.error('AI Not Configured', 'Please configure your AI provider in Settings.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStage('Reading project context & specifications…');

    try {
      // 1. Build compact, grounded request using project files & context
      const request = PreparationContextBuilder.buildRequest(
        activeProject.id,
        activeProject.name || activeProject.title,
        preferences,
        projectContextData
      );

      setGenerationStage('Synthesizing technical defense & weak areas…');

      // 2. Call unified AIProviderRouter for preparation plan generation
      const plan: PreparationPlan = await aiProviderRouter.generatePreparationPlan(request);

      // 3. Save to local repository namespaced to active project
      preparationPlanRepository.savePlan(plan);
      setActivePlan(plan);
      setPlansHistory(preparationPlanRepository.getPlans(activeProject.id));
      toast.success('Plan Generated', 'Your personalized preparation plan is ready.');
    } catch (err: any) {
      console.error('[PrepareMePage] Generation failed:', err);
      setGenerationError(
        err.message || 'Failed to generate preparation plan. Check AI connection and retry.'
      );
      toast.error('Generation Failed', err.message || 'Failed to generate preparation plan.');
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  const handleUpdateChecklist = (updatedChecklist: PreparationChecklistItem[]) => {
    if (!activePlan) return;
    const updatedPlan: PreparationPlan = {
      ...activePlan,
      checklist: updatedChecklist,
    };
    setActivePlan(updatedPlan);
    preparationPlanRepository.updatePlan(updatedPlan);
    setPlansHistory(preparationPlanRepository.getPlans(activePlan.projectId));
  };

  const handleDeletePlan = (planId: string) => {
    if (!activeProject) return;
    preparationPlanRepository.deletePlan(activeProject.id, planId);
    const updated = preparationPlanRepository.getPlans(activeProject.id);
    setPlansHistory(updated);
    if (activePlan?.id === planId) {
      setActivePlan(updated.length > 0 ? updated[0] : null);
    }
    toast.info('Plan Removed', 'The preparation plan was removed from history.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-100 uppercase font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                PREPARE ME
              </h1>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400">
                Turn your project into a preparation plan.
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Understand what you built, defend your technical decisions, and practice the questions that matter.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <SnapdragonBadge />

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <Cpu className="w-3 h-3 text-zinc-400" />
              <span className="text-zinc-500">AI:</span>
              <span>{activeProviderName}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-500">Mode:</span>
              {providerAvailable === false ? (
                <span className="text-amber-400">Not configured</span>
              ) : isLocalMode ? (
                <span className="text-emerald-400">Local</span>
              ) : (
                <span className="text-sky-400">Remote provider</span>
              )}
            </div>

            {hasProject && onNavigateToJudge && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToJudge}
                icon={<PlayCircle className="w-3.5 h-3.5 text-zinc-400" />}
              >
                Judge Mode
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* STATE 1: NO ACTIVE PROJECT */}
      {!hasProject ? (
        <EmptyState
          badgeText="PROJECT REQUIRED"
          icon={<FolderOpen className="w-6 h-6 text-zinc-400" />}
          title="Open a project before building a preparation plan."
          description="Aegis Local grounds your presentation defense directly in your project files, threat models, and architectural specifications."
          secondaryAction={
            <Button
              variant="outline"
              size="sm"
              onClick={loadDemoProject}
              icon={<FolderOpen className="w-3.5 h-3.5" />}
            >
              Open Demo Project
            </Button>
          }
        />
      ) : !projectContextData.hasExtractedKnowledge &&
        (!activeProject.files || activeProject.files.length === 0) ? (
        /* STATE 2: PROJECT HAS NO USABLE KNOWLEDGE */
        <EmptyState
          badgeText="EMPTY CONTEXT"
          icon={<AlertCircle className="w-6 h-6 text-amber-400" />}
          title="Add project material before preparing."
          description="Aegis builds presentation defense by analyzing your actual project documents and specifications. Add files to build project context."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenImportModal}
              icon={<UploadCloud className="w-3.5 h-3.5" />}
            >
              Import Files
            </Button>
          }
          secondaryAction={
            onNavigateToProject ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToProject}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Go to Project
              </Button>
            ) : undefined
          }
        />
      ) : (
        /* STATE 3: READY TO PREPARE OR VIEW EXISTING PLAN */
        <div className="space-y-6">
          {/* Controls Bar: Build My Preparation Plan & History Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-200">
                  Target Project: {activeProject.name || activeProject.title}
                </span>
                {projectContextData.sources.length > 0 && (
                  <span className="text-[11px] font-mono text-zinc-500">
                    ({projectContextData.sources.length} document source{projectContextData.sources.length > 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                {activePlan
                  ? 'Plan generated and saved locally for this project.'
                  : 'Configure your target format below to build your defense plan.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {plansHistory.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  icon={<History className="w-3.5 h-3.5" />}
                >
                  History ({plansHistory.length})
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                disabled={isGenerating}
                onClick={handleBuildPlan}
                icon={
                  isGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )
                }
              >
                {activePlan ? 'Regenerate Plan' : 'Build My Preparation Plan'}
              </Button>
            </div>
          </div>

          {/* Unconfigured Provider Banner */}
          {providerAvailable === false && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>AI provider not configured. Configure GEMINI_API_KEY to generate defense plans.</span>
              </div>
              {onNavigateToSettings && (
                <button
                  onClick={onNavigateToSettings}
                  className="text-amber-300 hover:text-amber-100 underline font-mono text-[11px] cursor-pointer"
                >
                  Configure AI in Settings
                </button>
              )}
            </div>
          )}

          {/* History Drawer */}
          {showHistory && plansHistory.length > 0 && (
            <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-zinc-300 flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  Previous Preparation Plans for this Project
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {plansHistory.map((p) => {
                  const isSelected = activePlan?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border text-xs font-mono transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500/70 text-zinc-100'
                          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">{p.preferences.goal}</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(p.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>Difficulty: {p.preferences.difficulty}</span>
                          <span>•</span>
                          <span>{p.preferences.sessionPreference}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                        <button
                          onClick={() => {
                            setActivePlan(p);
                            setShowHistory(false);
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          View Plan
                        </button>
                        <button
                          onClick={() => handleDeletePlan(p.id)}
                          className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Setup Panel (Always accessible for customizing target goals) */}
          <PreparationSetupPanel
            preferences={preferences}
            onChange={setPreferences}
            disabled={isGenerating}
          />

          {/* Generation Loading State with Honest Stage Tracking */}
          {isGenerating && (
            <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold font-mono uppercase text-zinc-100">
                  Building Your Preparation Plan
                </h3>
                <p className="text-xs font-mono text-emerald-400 animate-pulse">
                  {generationStage}
                </p>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono max-w-sm">
                Grounding questions in your actual architecture, security primitives, and project files.
              </p>
            </div>
          )}

          {/* Error State */}
          {generationError && !isGenerating && (
            <div className="rounded-2xl bg-red-950/30 border border-red-800/40 p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-300 font-mono text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Preparation couldn&apos;t be generated.</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{generationError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBuildPlan}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Active Generated Plan Display */}
          {activePlan && !isGenerating && (
            <div className="space-y-4">
              <PreparationPlanViewer
                plan={activePlan}
                onUpdateChecklist={handleUpdateChecklist}
              />
            </div>
          )}

          {/* Empty State before First Generation */}
          {!activePlan && !isGenerating && !generationError && (
            <div className="rounded-2xl bg-zinc-950/40 border border-zinc-800/80 p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
                Your preparation plan starts with your project context.
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Click &ldquo;Build My Preparation Plan&rdquo; above to analyze your project documents, anticipate tough technical questions, identify weak areas, and generate a 60-second pitch.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
