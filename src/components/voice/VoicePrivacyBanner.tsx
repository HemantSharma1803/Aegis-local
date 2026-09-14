import React, { useState } from 'react';
import { ShieldCheck, Mic, Lock, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface VoicePrivacyBannerProps {
  providerName: string;
  isSupported: boolean;
}

export const VoicePrivacyBanner: React.FC<VoicePrivacyBannerProps> = ({
  providerName,
  isSupported,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeProject } = useProject();

  return (
    <div
      id="voice-privacy-banner"
      className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 text-xs text-zinc-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Privacy Assured
          </span>

          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>Microphone requires explicit start</span>
          </span>

          <span className="hidden sm:inline text-zinc-600">•</span>

          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Raw audio is never stored</span>
          </span>

          <span className="hidden md:inline text-zinc-600">•</span>

          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[200px]">AI Engine: {providerName}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 font-medium text-[11px] shrink-0"
          aria-expanded={isExpanded}
          aria-label="Toggle voice privacy details"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Privacy Contract'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-zinc-400 leading-relaxed">
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
            <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              Microphone Access
            </div>
            <p className="text-[11px]">
              Microphone permission is requested solely when you press <strong>Start Recording</strong>.
              Aegis never continuously listens in the background. Stopping the recording immediately closes the media stream.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
            <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Audio Discard Policy
            </div>
            <p className="text-[11px]">
              Audio data is transcribed directly into text. The raw audio buffer is discarded immediately upon recording end.
              Only the editable transcript is retained locally in your browser storage for project <strong>{activeProject?.name || 'current project'}</strong>.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
            <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Provider Processing
            </div>
            <p className="text-[11px]">
              AI transcript analysis follows your configured AI Provider ({providerName}).
              Project knowledge is only sent via server enclave with zero retention. On-device local evaluation is automatically utilized when offline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
