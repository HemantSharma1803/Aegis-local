import React from 'react';
import {
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  TrendingUp,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';
import { OverallReadinessLevel } from '../../types/readiness';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface OverallReadinessCardProps {
  level: OverallReadinessLevel;
  score: number;
  explanation: string;
  sessionsCount: number;
  evidenceCount: number;
  providerName: string;
  processingMode: string;
}

export const OverallReadinessCard: React.FC<OverallReadinessCardProps> = ({
  level,
  score,
  explanation,
  sessionsCount,
  evidenceCount,
  providerName,
  processingMode,
}) => {
  const getLevelConfig = (lvl: OverallReadinessLevel) => {
    switch (lvl) {
      case 'strong-defense':
        return {
          title: 'Strong Defense',
          badgeVariant: 'success' as const,
          colorClass: 'text-emerald-400',
          bgClass: 'bg-emerald-500/10 border-emerald-500/20',
          stepIndex: 4,
        };
      case 'presentation-ready':
        return {
          title: 'Presentation Ready',
          badgeVariant: 'info' as const,
          colorClass: 'text-sky-400',
          bgClass: 'bg-sky-500/10 border-sky-500/20',
          stepIndex: 3,
        };
      case 'building-confidence':
        return {
          title: 'Building Confidence',
          badgeVariant: 'warning' as const,
          colorClass: 'text-amber-400',
          bgClass: 'bg-amber-500/10 border-amber-500/20',
          stepIndex: 2,
        };
      case 'early-preparation':
        return {
          title: 'Early Preparation',
          badgeVariant: 'error' as const,
          colorClass: 'text-rose-400',
          bgClass: 'bg-rose-500/10 border-rose-500/20',
          stepIndex: 1,
        };
      default:
        return {
          title: 'Not Evaluated',
          badgeVariant: 'outline' as const,
          colorClass: 'text-zinc-400',
          bgClass: 'bg-zinc-800/40 border-zinc-700/40',
          stepIndex: 0,
        };
    }
  };

  const config = getLevelConfig(level);

  const stages = [
    { label: 'Early Prep', step: 1 },
    { label: 'Building Confidence', step: 2 },
    { label: 'Presentation Ready', step: 3 },
    { label: 'Strong Defense', step: 4 },
  ];

  return (
    <Card variant="default" className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Icon and Level */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${config.bgClass} ${config.colorClass}`}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Overall Assessment
              </span>
              <Badge variant={config.badgeVariant} size="sm">
                {config.title.toUpperCase()}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-zinc-100">{config.title}</h2>
          </div>
        </div>

        {/* Right: Quick Metrics */}
        <div className="flex items-center gap-6 text-xs font-mono">
          {level !== 'not-evaluated' && (
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Rubric Score</span>
              <span className="text-lg font-bold text-zinc-100">{score} / 5.0</span>
            </div>
          )}
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Simulations</span>
            <span className="text-lg font-bold text-zinc-100">{sessionsCount}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Evidence Probes</span>
            <span className="text-lg font-bold text-zinc-100">{evidenceCount}</span>
          </div>
        </div>
      </div>

      {/* Progress Stage Track */}
      {level !== 'not-evaluated' && (
        <div className="space-y-2 pt-1 border-t border-zinc-800/60">
          <div className="grid grid-cols-4 gap-2">
            {stages.map((st) => {
              const isPassed = config.stepIndex >= st.step;
              const isCurrent = config.stepIndex === st.step;
              return (
                <div key={st.step} className="space-y-1">
                  <div
                    className={`h-2 rounded-xs transition-all ${
                      isPassed
                        ? isCurrent
                          ? config.stepIndex >= 4
                            ? 'bg-emerald-400'
                            : config.stepIndex >= 3
                            ? 'bg-sky-400'
                            : 'bg-amber-400'
                          : 'bg-zinc-600'
                        : 'bg-zinc-800'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-mono block truncate ${
                      isCurrent ? 'text-zinc-200 font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Narrative Explanation */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed space-y-1">
        <span className="font-semibold text-zinc-200 block text-[11px] font-mono uppercase tracking-wider">
          Evidence-Derived Synthesis
        </span>
        <p>{explanation}</p>
      </div>

      {/* Footer / Transparency Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-500 font-mono gap-2 pt-1">
        <span>Assessment Engine: {providerName}</span>
        <span>Processing Mode: {processingMode === 'local' ? 'On-Device Rule Engine' : 'Secure API Enclave'}</span>
      </div>
    </Card>
  );
};
