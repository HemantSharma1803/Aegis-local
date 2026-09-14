import React from 'react';
import { X, Clock, Trash2, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import { ReadinessReport } from '../../types/readiness';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ReadinessHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ReadinessReport[];
  currentReportId: string | null;
  onSelectReport: (report: ReadinessReport) => void;
  onDeleteReport: (reportId: string) => void;
}

export const ReadinessHistoryModal: React.FC<ReadinessHistoryModalProps> = ({
  isOpen,
  onClose,
  reports,
  currentReportId,
  onSelectReport,
  onDeleteReport,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-history-title"
      >
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h2 id="modal-history-title" className="text-sm font-bold text-zinc-100">
              Assessment History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 text-xs">
          {reports.length === 0 ? (
            <p className="text-zinc-500 text-center py-6 italic">No assessment history recorded.</p>
          ) : (
            reports.map((rep) => {
              const isSelected = rep.id === currentReportId;
              const dateStr = new Date(rep.generatedAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={rep.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-sky-950/20 border-sky-800/60 text-zinc-100'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      onSelectReport(rep);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-zinc-200">{dateStr}</span>
                      <Badge
                        variant={
                          rep.overallLevel === 'strong-defense'
                            ? 'success'
                            : rep.overallLevel === 'presentation-ready'
                            ? 'info'
                            : rep.overallLevel === 'building-confidence'
                            ? 'warning'
                            : 'outline'
                        }
                        size="sm"
                      >
                        {rep.overallLevel.toUpperCase()}
                      </Badge>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-sky-400 uppercase font-semibold">
                          (Current)
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      {rep.sessionsUsed.length} simulation(s) evaluated • {rep.overallScore}/5 rubric score
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onDeleteReport(rep.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1.5"
                      aria-label="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end bg-zinc-950/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
