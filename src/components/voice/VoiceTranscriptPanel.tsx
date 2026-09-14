import React from 'react';
import { FileText, Trash2, Copy, Check, Sparkles, Loader2, Edit2 } from 'lucide-react';

interface VoiceTranscriptPanelProps {
  transcript: string;
  onChangeTranscript: (text: string) => void;
  onClearTranscript: () => void;
  onAnalyzeAnswer: () => void;
  isAnalyzing: boolean;
  isRecording: boolean;
  durationSeconds: number;
  disabled?: boolean;
}

export const VoiceTranscriptPanel: React.FC<VoiceTranscriptPanelProps> = ({
  transcript,
  onChangeTranscript,
  onClearTranscript,
  onAnalyzeAnswer,
  isAnalyzing,
  isRecording,
  durationSeconds,
  disabled = false,
}) => {
  const [copied, setCopied] = React.useState(false);
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const durationMinutes = Math.max(durationSeconds / 60, 0.1);
  const wordsPerMinute = durationSeconds > 0 ? Math.round(wordCount / durationMinutes) : 0;

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="voice-transcript-panel"
      className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-zinc-200">Spoken Answer Transcript</h3>
          <span className="text-xs text-zinc-500 font-mono">
            ({wordCount} words{wordsPerMinute > 0 ? ` • ~${wordsPerMinute} wpm` : ''})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {transcript && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                disabled={isRecording}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                title="Copy transcript"
                aria-label="Copy transcript"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onClearTranscript}
                disabled={isRecording || isAnalyzing}
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
                title="Clear transcript"
                aria-label="Clear transcript"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editable Text Area */}
      <div className="relative">
        <textarea
          id="voice-transcript-input"
          value={transcript}
          onChange={(e) => onChangeTranscript(e.target.value)}
          placeholder={
            isRecording
              ? 'Listening to speech... Your spoken words will transcribe here in real time.'
              : 'Record your answer using the microphone, or type/paste your verbal practice response here...'
          }
          rows={6}
          disabled={isRecording || isAnalyzing}
          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-y leading-relaxed transition-all font-sans"
        />

        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/70 border border-rose-800 text-[10px] text-rose-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            Transcribing Live
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <div className="text-[11px] text-zinc-500 flex items-center gap-1">
          <Edit2 className="w-3 h-3 text-zinc-400" />
          <span>You can freely edit or polish the transcript before running evaluation.</span>
        </div>

        <button
          type="button"
          id="btn-analyze-voice-answer"
          disabled={!transcript.trim() || isRecording || isAnalyzing || disabled}
          onClick={onAnalyzeAnswer}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Answer with Aegis...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Analyze Answer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
