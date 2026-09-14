import React, { useState } from 'react';
import { Sparkles, HelpCircle, ChevronDown, Check, Lightbulb } from 'lucide-react';
import { VoicePracticePrompt } from '../../types/voice';

interface VoicePromptCardProps {
  currentPrompt: VoicePracticePrompt;
  availablePrompts: VoicePracticePrompt[];
  onSelectPrompt: (prompt: VoicePracticePrompt) => void;
  disabled?: boolean;
}

export const VoicePromptCard: React.FC<VoicePromptCardProps> = ({
  currentPrompt,
  availablePrompts,
  onSelectPrompt,
  disabled = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div
      id="voice-prompt-card"
      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {currentPrompt.title}
          </span>

          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-800 text-zinc-400 capitalize">
            {currentPrompt.category}
          </span>

          {currentPrompt.sourceQuestionId && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
              From Defense Evidence
            </span>
          )}
        </div>

        {availablePrompts.length > 1 && (
          <div className="relative">
            <button
              type="button"
              id="btn-switch-prompt"
              disabled={disabled}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors disabled:opacity-50"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span>Change Prompt ({availablePrompts.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-80 max-h-72 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-30 p-1.5 space-y-1"
                role="listbox"
              >
                {availablePrompts.map((prompt) => {
                  const isCur = prompt.id === currentPrompt.id;
                  return (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => {
                        onSelectPrompt(prompt);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 ${
                        isCur
                          ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-800/50'
                          : 'hover:bg-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium mb-0.5 flex items-center gap-1.5">
                          {prompt.title}
                          {prompt.sourceQuestionId && (
                            <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-300">
                              Sim
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-2">
                          {prompt.promptText}
                        </div>
                      </div>
                      {isCur && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Prompt Statement */}
      <div className="text-zinc-100 font-medium text-base sm:text-lg leading-relaxed mb-4">
        {currentPrompt.promptText}
      </div>

      {/* Guidance / Target Points */}
      {currentPrompt.guidance && currentPrompt.guidance.length > 0 && (
        <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Preparation & Delivery Guidance</span>
          </div>
          <ul className="space-y-1.5">
            {currentPrompt.guidance.map((hint, idx) => (
              <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                <span className="text-zinc-500 font-mono text-[10px] mt-0.5">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
