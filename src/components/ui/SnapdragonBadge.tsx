import React, { useState } from 'react';
import { Cpu, Info, CheckCircle2, Shield } from 'lucide-react';

export interface SnapdragonBadgeProps {
  isActive?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const SnapdragonBadge: React.FC<SnapdragonBadgeProps> = ({
  isActive = false,
  className = '',
  size = 'sm',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        id="snapdragon-ready-badge-btn"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 rounded-md border font-mono transition-all duration-150 select-none ${
          size === 'sm'
            ? 'text-[10px] px-2 py-0.5 tracking-tight'
            : 'text-xs px-2.5 py-1'
        } ${
          isActive
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/40'
            : 'bg-zinc-900/90 text-zinc-300 border-zinc-700/70 hover:border-zinc-500 hover:text-zinc-100'
        }`}
        title="Snapdragon-ready architecture details"
      >
        <Cpu className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${isActive ? 'text-emerald-400' : 'text-sky-400'}`} />
        <span className="font-medium whitespace-nowrap">
          {isActive ? 'Snapdragon NPU Active' : 'Snapdragon-Ready Architecture'}
        </span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400/80'
          }`}
        />
      </button>

      {/* Honest transparent popover / tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute right-0 top-full mt-2 w-72 p-3 rounded-lg bg-zinc-900 border border-zinc-700/90 shadow-xl shadow-black/50 z-50 text-[11px] text-zinc-300 space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold font-mono border-b border-zinc-800 pb-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Qualcomm Snapdragon Architecture</span>
          </div>

          <p className="leading-relaxed text-zinc-300">
            {isActive
              ? 'Local on-device inference is active on this device via Qualcomm Hexagon NPU hardware accelerator.'
              : 'Architecture prepared for Snapdragon-optimized local inference. Integrates with Qualcomm AI Engine, QNN SDK, and ONNX Runtime for NPU execution on Windows ARM64.'}
          </p>

          <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Zero-claim policy</span>
            </span>
            <span className="font-mono text-zinc-500">Target: Win11 ARM64</span>
          </div>
        </div>
      )}
    </div>
  );
};
