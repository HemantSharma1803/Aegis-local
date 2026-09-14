import React from 'react';
import { Timer, Compass, Cpu, Gavel } from 'lucide-react';
import { VoicePracticeMode } from '../../types/voice';

interface VoiceModeSelectorProps {
  activeMode: VoicePracticeMode;
  onSelectMode: (mode: VoicePracticeMode) => void;
  disabled?: boolean;
}

interface ModeConfig {
  id: VoicePracticeMode;
  label: string;
  durationLabel: string;
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
}

export const VoiceModeSelector: React.FC<VoiceModeSelectorProps> = ({
  activeMode,
  onSelectMode,
  disabled = false,
}) => {
  const modes: ModeConfig[] = [
    {
      id: 'pitch-60',
      label: '60-Second Pitch',
      durationLabel: '60s max',
      description: 'High-speed elevator pitch covering problem, solution, and primary differentiation.',
      icon: <Timer className="w-4 h-4 text-amber-400" />,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      id: 'project-overview',
      label: 'Project Explanation',
      durationLabel: '3m max',
      description: 'Structured end-to-end walkthrough of architecture, user journey, and real-world value.',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      id: 'technical-answer',
      label: 'Technical Answer',
      durationLabel: '3m max',
      description: 'Deep-dive technical defense of stack selections, security model, or engineering trade-offs.',
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      id: 'judge-question',
      label: 'Judge Question',
      durationLabel: '3m max',
      description: 'Fielding targeted cross-examination questions generated from Judge Mode or Preparation Plan.',
      icon: <Gavel className="w-4 h-4 text-emerald-400" />,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {modes.map((mode) => {
        const isSelected = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            id={`voice-mode-tab-${mode.id}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMode(mode.id)}
            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
              isSelected
                ? 'bg-zinc-900/90 border-cyan-500/50 shadow-sm shadow-cyan-950/30 ring-1 ring-cyan-500/20'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700/80 text-zinc-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg border ${
                    isSelected ? 'bg-zinc-800/90 border-zinc-700' : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  {mode.icon}
                </div>
                <span className={`font-semibold text-xs ${isSelected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                  {mode.label}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${mode.badgeColor}`}
              >
                {mode.durationLabel}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal line-clamp-2">
              {mode.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
