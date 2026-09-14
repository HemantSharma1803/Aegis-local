import React from 'react';
import { X, History, Trash2, Calendar, Clock, Award, ChevronRight } from 'lucide-react';
import { VoicePracticeSession } from '../../types/voice';

interface VoiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: VoicePracticeSession[];
  onSelectSession: (session: VoicePracticeSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

export const VoiceHistoryModal: React.FC<VoiceHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-history-modal-title"
    >
      <div className="bg-[#12141c] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 id="voice-history-modal-title" className="text-sm font-bold text-zinc-100">
                Voice Practice History
              </h2>
              <p className="text-[11px] text-zinc-400">
                {sessions.length} recorded practice attempt{sessions.length === 1 ? '' : 's'} for this project
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] px-2.5 py-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60 rounded-md transition-colors"
              >
                Clear History
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No voice practice attempts recorded yet for this project.
            </div>
          ) : (
            sessions.map((sess) => {
              const dateStr = new Date(sess.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-zinc-200">
                          {sess.prompt.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase font-mono">
                          {sess.prompt.mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sess.durationSeconds}s
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {sess.result && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 font-mono text-xs text-zinc-200">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>{sess.result.overallRubricScore.toFixed(1)}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteSession(sess.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Delete session"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 italic bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                    "{sess.transcript}"
                  </p>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSession(sess);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      <span>Load into Workspace</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
