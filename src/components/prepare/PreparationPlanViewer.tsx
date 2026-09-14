import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ListTodo,
  ExternalLink,
  Target,
  Flame,
  Zap,
} from 'lucide-react';
import {
  PreparationPlan,
  PreparationChecklistItem,
  KeyTalkingPoint,
  TechnicalDefenseItem,
  DifficultQuestionItem,
  WeakAreaItem,
  TechnicalTradeoffItem,
  LikelyQuestionItem,
} from '../../types/prepare';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';

interface PreparationPlanViewerProps {
  plan: PreparationPlan;
  onUpdateChecklist: (updatedChecklist: PreparationChecklistItem[]) => void;
}

export const PreparationPlanViewer: React.FC<PreparationPlanViewerProps> = ({
  plan,
  onUpdateChecklist,
}) => {
  const { toast } = useToast();
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [expandedDefenseIndex, setExpandedDefenseIndex] = useState<number | null>(0);
  const [expandedDifficultIndex, setExpandedDifficultIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'pitch'
    | 'story'
    | 'talking-points'
    | 'defense'
    | 'difficult-questions'
    | 'weak-areas'
    | 'tradeoffs'
    | 'likely-questions'
    | 'practice'
  >('overview');

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(plan.pitch60s.pitch);
    setCopiedPitch(true);
    toast.success('Pitch Copied', '60-second pitch copied to clipboard.');
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleToggleChecklist = (id: string) => {
    const updated = plan.checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdateChecklist(updated);
  };

  const getPriorityBadgeVariant = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Meta Banner */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-500">Target:</span>
          <span className="text-zinc-200 font-semibold">{plan.preferences.goal}</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-500">Difficulty:</span>
          <span className="text-emerald-400">{plan.preferences.difficulty}</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-500">Session:</span>
          <span className="text-sky-400">{plan.preferences.sessionPreference}</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-500">Created:</span>
          <span className="text-zinc-400">
            {new Date(plan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">Grounded via:</span>
          <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px]">
            {plan.providerName}
          </span>
        </div>
      </div>

      {/* Navigation Tabs for Progressive Disclosure */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-800/80 scrollbar-none text-xs font-mono">
        {[
          { id: 'overview', label: 'Project Summary' },
          { id: 'pitch', label: '60s Pitch' },
          { id: 'story', label: 'Presentation Story' },
          { id: 'talking-points', label: `Talking Points (${plan.keyPoints.length})` },
          { id: 'defense', label: `Technical Defense (${plan.technicalDefense.length})` },
          { id: 'difficult-questions', label: `Difficult Questions (${plan.difficultQuestions.length})` },
          { id: 'weak-areas', label: `Weak Areas (${plan.weakAreas.length})` },
          { id: 'tradeoffs', label: `Trade-offs (${plan.tradeoffs.length})` },
          { id: 'likely-questions', label: `Likely Questions (${plan.likelyQuestions.length})` },
          { id: 'practice', label: 'Practice & Checklist' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/70 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Project Understanding & Grounded Summary
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">
                Evidence-backed synthesis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                  What It Is
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {plan.projectSummary.whatItIs || 'Defined by project documentation.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                  Problem It Solves
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {plan.projectSummary.problemItSolves || 'Extracted from problem statement.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400">
                  How It Works
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {plan.projectSummary.howItWorks || 'Grounded in system workflow.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400">
                  Why It Matters
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {plan.projectSummary.whyItMatters || 'Evaluated for architectural impact.'}
                </p>
              </div>
            </div>

            {plan.sourceAttributions.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/70 flex items-center gap-2 flex-wrap text-[11px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-zinc-400">
                  <FileText className="w-3 h-3" />
                  Grounded Sources:
                </span>
                {plan.sourceAttributions.map((src, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                  >
                    {src.fileName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. 60-SECOND PITCH */}
      {activeTab === 'pitch' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                60-Second Spoken Pitch
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Spoken-language friendly, technically credible, grounded in your actual project
              </p>
            </div>
            <button
              onClick={handleCopyPitch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 transition-colors cursor-pointer"
            >
              {copiedPitch ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Pitch</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-sm leading-relaxed text-zinc-100 font-sans whitespace-pre-wrap">
            {plan.pitch60s.pitch}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              Target delivery time: ~60 seconds (140-160 words)
            </span>
            <span>Avoid buzzwords; deliver with calm confidence.</span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. PRESENTATION STORY */}
      {activeTab === 'story' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
              Presentation Story & Narrative Arc
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Structured progression for technical defense. Sections lacking evidence explicitly indicate gaps.
            </p>
          </div>

          <div className="space-y-3">
            {plan.presentationStory.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-200 font-mono uppercase">
                    {sec.title}
                  </h4>
                  {sec.needsProjectEvidence && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono">
                      Needs project evidence
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {sec.narrative}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. KEY TALKING POINTS */}
      {activeTab === 'talking-points' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
              Key Talking Points
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Critical takeaways grounded in project files that every reviewer must remember
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.keyPoints.map((kp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
                      {kp.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-100">{kp.topic}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {kp.whyItMatters}
                  </p>
                </div>
                {kp.supportingSource && (
                  <div className="pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500 flex items-center gap-1 truncate">
                    <FileText className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                    <span className="truncate">{kp.supportingSource}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. TECHNICAL DEFENSE */}
      {activeTab === 'defense' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Technical Defense & Architectural Scrutiny
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Anticipated technical challenges and evidenced response structures
            </p>
          </div>

          <div className="space-y-3">
            {plan.technicalDefense.map((item, idx) => {
              const isExpanded = expandedDefenseIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDefenseIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-zinc-100">
                        {item.question}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        Judge Concern: {item.whyAsked}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-3 border-t border-zinc-800/60 bg-zinc-950/30">
                      <div className="space-y-1 pt-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                          Project Evidence
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                          {item.projectEvidence}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block">
                          Suggested Answer Structure
                        </span>
                        <ul className="space-y-1 text-xs text-zinc-300 pl-4 list-disc">
                          {item.suggestedAnswerStructure.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {item.sourceFiles && item.sourceFiles.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                          <FileText className="w-3 h-3 text-zinc-400" />
                          <span>Sources: {item.sourceFiles.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. DIFFICULT QUESTIONS */}
      {activeTab === 'difficult-questions' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Questions That Could Expose Weaknesses
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Tough inquiries on limitations, security assumptions, latency, and edge failure modes
            </p>
          </div>

          <div className="space-y-3">
            {plan.difficultQuestions.map((item, idx) => {
              const isExpanded = expandedDifficultIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDifficultIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                          {item.area}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-100">
                        {item.question}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-3 border-t border-zinc-800/60 bg-zinc-950/30">
                      <div className="space-y-1 pt-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">
                          Underlying Vulnerability or Risk
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {item.vulnerabilityOrRisk}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                          Recommended Defense Strategy
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-900/70 p-2.5 rounded-lg border border-zinc-800">
                          {item.defenseRecommendation}
                        </p>
                      </div>

                      {item.sourceFiles && item.sourceFiles.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                          <FileText className="w-3 h-3 text-zinc-400" />
                          <span>Sources: {item.sourceFiles.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. WEAK AREAS */}
      {activeTab === 'weak-areas' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
              Identified Weak Areas & Evidence Gaps
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Confidence-aware audit of where project documentation or implementation is thin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.weakAreas.map((w, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-100 font-mono">{w.area}</h4>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
                    Audit Finding
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Impact</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{w.whyItMatters}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-400/90 uppercase">
                    Missing Evidence
                  </span>
                  <p className="text-xs text-zinc-400 italic leading-relaxed">
                    {w.missingEvidence}
                  </p>
                </div>

                <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">
                    Preparation Action
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {w.recommendedPreparation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. TRADE-OFFS */}
      {activeTab === 'tradeoffs' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
              Technical Trade-offs & Alternatives
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Architectural decisions, labeled possible alternatives, and defensible engineering rationale
            </p>
          </div>

          <div className="space-y-3">
            {plan.tradeoffs.map((t, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      Decision
                    </span>
                    <h4 className="text-xs font-bold text-zinc-100">{t.decision}</h4>
                  </div>
                  <div className="text-right sm:text-right">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      Possible Alternative
                    </span>
                    <div className="text-xs font-mono text-zinc-300">{t.alternativeLabel}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">
                      Why Chosen
                    </span>
                    <p className="text-zinc-300 leading-relaxed">{t.whyDecisionMade}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 uppercase">
                      Potential Downside
                    </span>
                    <p className="text-zinc-300 leading-relaxed">{t.potentialDownside}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 space-y-1">
                    <span className="text-[10px] font-mono text-sky-400 uppercase">
                      How To Defend
                    </span>
                    <p className="text-zinc-300 leading-relaxed">{t.howToDefend}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. LIKELY QUESTIONS */}
      {activeTab === 'likely-questions' && (
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
              Prioritized Likely Questions
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Categorized and prioritized without fake statistical percentages
            </p>
          </div>

          <div className="space-y-2.5">
            {plan.likelyQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityBadgeVariant(q.priority)} size="sm">
                      {q.priority} Priority
                    </Badge>
                    <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                      {q.category}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-100">{q.question}</div>
                </div>

                {q.sourceReferences && q.sourceReferences.length > 0 && (
                  <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 flex-shrink-0">
                    <FileText className="w-3 h-3 text-zinc-400" />
                    <span>{q.sourceReferences.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 10. PRACTICE & CHECKLIST */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Preparation Checklist */}
          <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                Preparation Checklist
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Grounded milestones generated directly from your plan
              </p>
            </div>

            <div className="space-y-2">
              {plan.checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    item.completed
                      ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300 line-through'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-mono">{item.task}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Practice Drills */}
          <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-4">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-sky-400" />
                Recommended Practice Drills
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Targeted exercises addressing identified defense gaps
              </p>
            </div>

            <div className="space-y-3">
              {plan.recommendedPractice.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-950/50 border border-sky-800/50">
                      {rec.tag}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-100">{rec.action}</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
