import React from 'react';
import {
  PreparationPreferences,
  PreparationGoal,
  PreparationDifficulty,
  PreparationFocusArea,
  SessionPreference,
} from '../../types/prepare';
import { Sliders, Sparkles, Target, Zap, Shield, Flame } from 'lucide-react';

interface PreparationSetupPanelProps {
  preferences: PreparationPreferences;
  onChange: (preferences: PreparationPreferences) => void;
  disabled?: boolean;
}

export const PreparationSetupPanel: React.FC<PreparationSetupPanelProps> = ({
  preferences,
  onChange,
  disabled = false,
}) => {
  const goals: { id: PreparationGoal; label: string; desc: string }[] = [
    { id: 'Competition', label: 'Competition', desc: 'Skeptical judges, strict time limit, high technical scrutiny.' },
    { id: 'Project Demo', label: 'Project Demo', desc: 'Live audience walkthrough, feature impact, clear narrative.' },
    { id: 'Technical Interview', label: 'Technical Interview', desc: 'Deep architectural defense, algorithmic choices, trade-offs.' },
    { id: 'Project Viva', label: 'Project Viva', desc: 'Academic and implementation defense, theoretical rigor.' },
    { id: 'General Presentation', label: 'General Presentation', desc: 'Balanced overview for cross-functional stakeholders.' },
  ];

  const difficulties: { id: PreparationDifficulty; label: string; desc: string }[] = [
    { id: 'Foundational', label: 'Foundational', desc: 'Core architecture and primary flow.' },
    { id: 'Technical', label: 'Technical', desc: 'Deep dive into constraints and design decisions.' },
    { id: 'Challenging', label: 'Challenging', desc: 'Adversarial edge cases, failures, and vulnerability probing.' },
  ];

  const allFocusAreas: PreparationFocusArea[] = [
    'Project Story',
    'Problem & Solution',
    'Architecture',
    'Technology Choices',
    'Security',
    'AI/ML',
    'Trade-offs',
    'Potential Questions',
  ];

  const sessionPreferences: { id: SessionPreference; label: string; desc: string }[] = [
    { id: 'Quick', label: 'Quick', desc: 'Fast drill on core highlights.' },
    { id: 'Standard', label: 'Standard', desc: 'Balanced defense and pitch plan.' },
    { id: 'Deep', label: 'Deep', desc: 'Comprehensive technical audit and edge questions.' },
  ];

  const toggleFocusArea = (area: PreparationFocusArea) => {
    if (disabled) return;
    const exists = preferences.focusAreas.includes(area);
    if (exists) {
      if (preferences.focusAreas.length === 1) return; // Keep at least one
      onChange({
        ...preferences,
        focusAreas: preferences.focusAreas.filter((a) => a !== area),
      });
    } else {
      onChange({
        ...preferences,
        focusAreas: [...preferences.focusAreas, area],
      });
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
            Preparation Setup & Focus Controls
          </h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Personalized to your target presentation format
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Preparation Goal */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Target className="w-3 h-3 text-zinc-400" />
            <span>Preparation Goal</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {goals.map((g) => {
              const isSelected = preferences.goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...preferences, goal: g.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-xs font-semibold">{g.label}</div>
                  <div className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">
                    {g.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Difficulty & Session Depth */}
        <div className="space-y-4">
          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-zinc-400" />
              <span>Scrutiny Difficulty</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((d) => {
                const isSelected = preferences.difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ ...preferences, difficulty: d.id })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-zinc-100'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-xs font-semibold">{d.label}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                      {d.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Depth */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-zinc-400" />
              <span>Session Preference</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sessionPreferences.map((s) => {
                const isSelected = preferences.sessionPreference === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ ...preferences, sessionPreference: s.id })}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-zinc-100'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-xs font-semibold">{s.label}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                      {s.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Focus Areas (Multi-select) */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-zinc-400" />
            <span>Target Focus Areas (Select Multiple)</span>
          </label>
          <span className="text-[10px] text-zinc-400 font-mono">
            {preferences.focusAreas.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allFocusAreas.map((area) => {
            const isSelected = preferences.focusAreas.includes(area);
            return (
              <button
                key={area}
                type="button"
                disabled={disabled}
                onClick={() => toggleFocusArea(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/60 border border-emerald-500/80 text-emerald-200 shadow-sm'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSelected ? '✓ ' : '+ '}
                {area}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
