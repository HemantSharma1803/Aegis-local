import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { CategoryAssessment } from '../../types/readiness';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CategoryDetailModalProps {
  category: CategoryAssessment | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunchPractice?: () => void;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  category,
  isOpen,
  onClose,
  onLaunchPractice,
}) => {
  if (!isOpen || !category) return null;

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'strong':
        return 'success';
      case 'competent':
        return 'warning';
      case 'developing':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'strong':
        return 'STRONG DEFENSE';
      case 'competent':
        return 'COMPETENT / READY';
      case 'developing':
        return 'DEVELOPING';
      default:
        return 'NOT EVALUATED';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-category-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-start justify-between gap-4 bg-zinc-950/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="modal-category-title" className="text-base font-bold text-zinc-100">
                {category.name}
              </h2>
              <Badge variant={getBadgeVariant(category.level)} size="sm">
                {getLevelLabel(category.level)}
              </Badge>
              {category.score > 0 && (
                <span className="text-xs font-mono text-zinc-400">
                  Rubric: {category.score} / 5.0
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">{category.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Assessment Narrative */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Grounded Assessment
            </span>
            <p className="text-zinc-200 text-sm leading-relaxed">{category.explanation}</p>
          </div>

          {/* Strengths & Gaps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-emerald-950/40 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono text-[11px] uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>What Went Well</span>
              </div>
              <ul className="space-y-1.5 text-zinc-300">
                {category.strengths && category.strengths.length > 0 ? (
                  category.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500 italic">No specific strengths documented.</li>
                )}
              </ul>
            </div>

            {/* Gaps */}
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-amber-950/40 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono text-[11px] uppercase">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>What Needs Work</span>
              </div>
              <ul className="space-y-1.5 text-zinc-300">
                {category.gaps && category.gaps.length > 0 ? (
                  category.gaps.map((g, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{g}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500 italic">No critical omissions recorded.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Traceable Evidence List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Traceable Practice Evidence ({category.evidence.length} items)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Source-backed defense records
              </span>
            </div>

            {category.evidence.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 text-zinc-500 text-center italic">
                No verified probe evidence exists for this category yet. Run a Judge simulation targeting this topic.
              </div>
            ) : (
              <div className="space-y-3">
                {category.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="font-mono">Judge Session • {ev.sourceDate}</span>
                      </div>
                      <Badge
                        variant={ev.strengthOrGap === 'strength' ? 'success' : ev.strengthOrGap === 'gap' ? 'warning' : 'outline'}
                        size="sm"
                      >
                        {ev.strengthOrGap === 'strength' ? 'DEMONSTRATED STRENGTH' : 'IDENTIFIED GAP'}
                      </Badge>
                    </div>

                    {ev.questionText && (
                      <div className="font-medium text-zinc-200">
                        &ldquo;{ev.questionText}&rdquo;
                      </div>
                    )}

                    {ev.answerSnippet && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 text-zinc-300">
                        <span className="font-semibold text-zinc-400 block mb-0.5 text-[10px] uppercase font-mono">
                          Presenter Defense:
                        </span>
                        <span>{ev.answerSnippet}</span>
                      </div>
                    )}

                    {ev.evaluationSnippet && (
                      <div className="text-zinc-400 italic pl-1 border-l-2 border-zinc-700">
                        Judge assessment: {ev.evaluationSnippet}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-900/30 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold block">
              Recommended Practice
            </span>
            <p className="text-zinc-300 text-xs leading-relaxed">{category.recommendation}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          {onLaunchPractice && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onLaunchPractice();
              }}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Practice in Judge Mode
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
