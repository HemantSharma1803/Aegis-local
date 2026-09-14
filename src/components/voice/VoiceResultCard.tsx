import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FolderGit2,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { VoicePracticeResult } from '../../types/voice';

interface VoiceResultCardProps {
  result: VoicePracticeResult;
  onNavigateToReadiness: () => void;
  onPracticeAgain: () => void;
}

export const VoiceResultCard: React.FC<VoiceResultCardProps> = ({
  result,
  onNavigateToReadiness,
  onPracticeAgain,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 3.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div
      id="voice-result-card"
      className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col gap-6"
    >
      {/* Header & Overall Rubric Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-zinc-100">Verbal Practice Evaluation</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono capitalize">
              {result.mode.replace('-', ' ')}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{result.summary}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-zinc-400">
              Evaluation Rubric
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {result.overallRubricScore.toFixed(1)}
              <span className="text-xs font-normal text-zinc-500"> / 5.0</span>
            </div>
          </div>

          <div
            className={`px-3 py-2 rounded-xl border text-center font-mono font-semibold text-xs ${getScoreColor(
              result.overallRubricScore
            )}`}
          >
            {result.overallRubricScore >= 4.0
              ? 'Strong'
              : result.overallRubricScore >= 3.0
              ? 'Competent'
              : 'Developing'}
          </div>
        </div>
      </div>

      {/* Sub-Score Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 font-medium mb-1">Project Accuracy</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-mono text-zinc-100">
              {result.accuracyScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-500">Grounded in code</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 font-medium mb-1">Delivery Clarity</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-mono text-zinc-100">
              {result.clarityScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-500">Pacing & concision</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 font-medium mb-1">Technical Defense</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-mono text-zinc-100">
              {result.defenseScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-500">Architecture depth</span>
          </div>
        </div>
      </div>

      {/* Strengths & Improvements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-semibold text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Demonstrated Strengths</span>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((str, i) => (
              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-500 font-mono text-[10px] mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-semibold text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Targeted Refinements</span>
          </div>
          <ul className="space-y-2">
            {result.improvements.map((imp, i) => (
              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 font-mono text-[10px] mt-0.5">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Missing Points & Project Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Missing Points */}
        {result.missingPoints && result.missingPoints.length > 0 && (
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-zinc-300">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Key Omissions & Unaddressed Context</span>
            </div>
            <ul className="space-y-1.5">
              {result.missingPoints.map((pt, i) => (
                <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                  <span className="text-indigo-400 font-mono text-[10px] mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Project Evidence Cited */}
        {result.projectEvidence && result.projectEvidence.length > 0 && (
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-zinc-300">
              <FolderGit2 className="w-4 h-4 text-cyan-400" />
              <span>Project Evidence Grounding</span>
            </div>
            <ul className="space-y-1.5">
              {result.projectEvidence.map((ev, i) => (
                <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                  <span className="text-cyan-400 font-mono text-[10px] mt-0.5">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended Practice */}
      {result.recommendedPractice && result.recommendedPractice.length > 0 && (
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/30 flex items-start gap-3">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-xs text-cyan-300">Recommended Next Practice</div>
            <div className="text-xs text-zinc-300 leading-relaxed">
              {result.recommendedPractice[0]}
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation Actions */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 flex-wrap">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="text-xs px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
        >
          Practice Another Question
        </button>

        <button
          type="button"
          onClick={onNavigateToReadiness}
          className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>View Updated Readiness Report</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
