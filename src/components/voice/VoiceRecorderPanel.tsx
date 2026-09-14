import React from 'react';
import {
  Mic,
  Square,
  AlertCircle,
  Clock,
  Radio,
  Volume2,
  Edit3,
  CheckCircle,
} from 'lucide-react';

interface VoiceRecorderPanelProps {
  isRecording: boolean;
  elapsedSeconds: number;
  maxDurationSeconds: number;
  audioLevel: number; // 0 to 1
  sttSupported: boolean;
  unavailabilityReason?: string;
  micError?: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onManualInputFocus: () => void;
  disabled?: boolean;
}

export const VoiceRecorderPanel: React.FC<VoiceRecorderPanelProps> = ({
  isRecording,
  elapsedSeconds,
  maxDurationSeconds,
  audioLevel,
  sttSupported,
  unavailabilityReason,
  micError,
  onStartRecording,
  onStopRecording,
  onManualInputFocus,
  disabled = false,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, maxDurationSeconds - elapsedSeconds);
  const percentElapsed = Math.min(100, (elapsedSeconds / maxDurationSeconds) * 100);
  const isTimeCritical = remainingSeconds <= 10 && isRecording;

  return (
    <div
      id="voice-recorder-panel"
      className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4"
    >
      {/* Top Header: Recording Status & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isRecording
                ? 'bg-rose-500 animate-ping'
                : sttSupported
                ? 'bg-emerald-500'
                : 'bg-zinc-600'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              {isRecording ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span className="text-rose-400">Recording In Progress</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Microphone Standby</span>
                </>
              )}
            </span>
            <span className="text-[11px] text-zinc-500">
              {isRecording
                ? 'Speaking live — transcript updating in real time'
                : 'Requires explicit user click to activate microphone'}
            </span>
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span
              className={`font-mono font-bold text-sm ${
                isTimeCritical ? 'text-rose-400 animate-pulse' : 'text-zinc-100'
              }`}
            >
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              / {formatTime(maxDurationSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800/80">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isTimeCritical
              ? 'bg-rose-500'
              : isRecording
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500'
              : 'bg-zinc-700'
          }`}
          style={{ width: `${percentElapsed}%` }}
        />
      </div>

      {/* Live Audio Level & Waveform feedback when recording */}
      {isRecording && (
        <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex-1 flex items-center gap-1 h-5">
            {Array.from({ length: 24 }).map((_, i) => {
              // Synthetic waveform driven by real normalized audio level
              const factor = Math.sin((i / 24) * Math.PI);
              const heightPct = Math.max(15, Math.min(100, audioLevel * 100 * factor * 1.6));
              return (
                <div
                  key={i}
                  className="flex-1 bg-cyan-400/80 rounded-full transition-all duration-75"
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
          <span className="text-[10px] text-zinc-400 font-mono shrink-0">
            {audioLevel > 0.05 ? 'Voice Detected' : 'Listening...'}
          </span>
        </div>
      )}

      {/* Mic Permission / Hardware Error state */}
      {micError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-rose-200">Microphone Notice</div>
            <div className="text-[11px] leading-relaxed text-rose-300/90">{micError}</div>
          </div>
        </div>
      )}

      {/* Browser Speech Recognition Unsupported Callout & Graceful Fallback */}
      {!sttSupported && !micError && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-200">
                Speech-to-Text Unavailable in Current Browser
              </div>
              <div className="text-[11px] leading-relaxed text-amber-300/80">
                {unavailabilityReason ||
                  'The Web Speech Recognition API is unavailable in this environment. You can enter or paste your answer directly into the transcript box below.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onManualInputFocus}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium text-xs border border-amber-500/30 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Type Response
          </button>
        </div>
      )}

      {/* Control Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {!isRecording ? (
          <button
            type="button"
            id="btn-start-voice-recording"
            disabled={disabled || !sttSupported}
            onClick={onStartRecording}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            <Mic className="w-4 h-4" />
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            type="button"
            id="btn-stop-voice-recording"
            onClick={onStopRecording}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-rose-400/50"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Recording</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onManualInputFocus}
            className="text-xs px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Manual Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
