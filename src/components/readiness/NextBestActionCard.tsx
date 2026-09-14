import React from 'react';
import { Sparkles, ArrowRight, Target, PlayCircle, Mic, Compass } from 'lucide-react';
import { NextBestAction } from '../../types/readiness';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface NextBestActionCardProps {
  action: NextBestAction;
  onTakeAction: (targetRoute?: string) => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  action,
  onTakeAction,
}) => {
  const getButtonContent = () => {
    if (action.targetRoute === 'voice-practice') {
      return {
        label: 'Start Voice Practice',
        icon: <Mic className="w-3.5 h-3.5" />,
      };
    }
    if (action.targetRoute === 'prepare-me') {
      return {
        label: 'Open Preparation Plan',
        icon: <Compass className="w-3.5 h-3.5" />,
      };
    }
    return {
      label: 'Launch Targeted Simulation',
      icon: <PlayCircle className="w-3.5 h-3.5" />,
    };
  };

  const btn = getButtonContent();

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-zinc-900 border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Target className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Highest Impact Next Step
            </span>
          </div>
          <h3 className="text-base font-bold text-zinc-100">{action.title}</h3>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">{action.explanation}</p>
        </div>
      </div>

      <div className="shrink-0">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onTakeAction(action.targetRoute)}
          icon={btn.icon}
        >
          {btn.label}
        </Button>
      </div>
    </div>
  );
};
