import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  FolderGit2,
  TrendingUp,
  History,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import {
  VoicePracticeMode,
  VoicePracticePrompt,
  VoicePracticeResult,
  VoicePracticeSession,
} from '../types/voice';
import { speechToTextRegistry } from '../services/stt/SpeechToTextRegistry';
import { VoicePromptGenerator } from '../services/voice/VoicePromptGenerator';
import { voicePracticeService } from '../services/voice/VoicePracticeService';
import { voiceSessionRepository } from '../services/voice/VoiceSessionRepository';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';

import { VoicePrivacyBanner } from '../components/voice/VoicePrivacyBanner';
import { VoiceModeSelector } from '../components/voice/VoiceModeSelector';
import { VoicePromptCard } from '../components/voice/VoicePromptCard';
import { VoiceRecorderPanel } from '../components/voice/VoiceRecorderPanel';
import { VoiceTranscriptPanel } from '../components/voice/VoiceTranscriptPanel';
import { VoiceResultCard } from '../components/voice/VoiceResultCard';
import { VoiceHistoryModal } from '../components/voice/VoiceHistoryModal';
import { SnapdragonBadge } from '../components/ui/SnapdragonBadge';


interface VoicePracticePageProps {
  onNavigateToReadiness?: () => void;
  onNavigateToProject?: () => void;
}

export const VoicePracticePage: React.FC<VoicePracticePageProps> = ({
  onNavigateToReadiness,
  onNavigateToProject,
}) => {
  const { activeProject, projectContextData: projectContext } = useProject();
  const { showToast } = useToast();

  const [activeMode, setActiveMode] = useState<VoicePracticeMode>('pitch-60');
  const [promptsByMode, setPromptsByMode] = useState<Record<VoicePracticeMode, VoicePracticePrompt[]>>({
    'pitch-60': [],
    'project-overview': [],
    'technical-answer': [],
    'judge-question': [],
  });
  const [selectedPrompt, setSelectedPrompt] = useState<VoicePracticePrompt | null>(null);

  // Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Transcript state
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestResult, setLatestResult] = useState<VoicePracticeResult | null>(null);

  // History state
  const [historySessions, setHistorySessions] = useState<VoicePracticeSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // STT Provider state
  const bestStt = speechToTextRegistry.getBestAvailableProvider();
  const sttProvider = bestStt.provider;
  const isSttSupported = bestStt.isSupported;
  const unavailabilityReason = bestStt.unavailabilityReason;

  const timerRef = useRef<any>(null);
  const transcriptInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Load project prompts and history when activeProject changes
  useEffect(() => {
    if (!activeProject) return;

    const generated = VoicePromptGenerator.generatePrompts(
      activeProject.id,
      activeProject.name,
      projectContext
    );
    setPromptsByMode(generated);

    // Set default prompt for initial mode
    if (generated[activeMode] && generated[activeMode].length > 0) {
      setSelectedPrompt(generated[activeMode][0]);
    }

    // Load past sessions
    const past = voiceSessionRepository.getSessions(activeProject.id);
    setHistorySessions(past);
  }, [activeProject?.id, projectContext]);

  // Update selected prompt when mode changes
  const handleSelectMode = (mode: VoicePracticeMode) => {
    if (isRecording) {
      handleStopRecording();
    }
    setActiveMode(mode);
    const modePrompts = promptsByMode[mode] || [];
    if (modePrompts.length > 0) {
      setSelectedPrompt(modePrompts[0]);
    }
  };

  // Timer interval
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          const maxSecs = selectedPrompt?.maxDurationSeconds || 180;
          if (next >= maxSecs) {
            handleStopRecording();
            showToast('Time limit reached for this practice mode.', 'info');
            return maxSecs;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, selectedPrompt]);

  // Ensure microphone and speech listeners are strictly cleaned up when unmounting
  useEffect(() => {
    return () => {
      try {
        sttProvider.abort();
      } catch (err) {
        // ignore
      }
    };
  }, [sttProvider]);

  // Start recording action
  const handleStartRecording = async () => {
    setMicError(null);
    setElapsedSeconds(0);
    setTranscript('');
    setLatestResult(null);

    try {
      await sttProvider.start({
        onStart: () => {
          setIsRecording(true);
        },
        onResult: (payload) => {
          setTranscript(payload.transcript);
        },
        onError: (err) => {
          console.warn('[VoicePracticePage] Speech error:', err);
          setMicError(err.message);
          setIsRecording(false);
          showToast(err.message, 'warning');
        },
        onEnd: () => {
          setIsRecording(false);
          setAudioLevel(0);
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
      });
    } catch (err: any) {
      console.warn('[VoicePracticePage] Start recording caught error:', err);
      setIsRecording(false);
      setMicError(err.message || 'Could not access microphone.');
      showToast(err.message || 'Microphone activation failed.', 'error');
    }
  };

  // Stop recording action
  const handleStopRecording = async () => {
    setIsRecording(false);
    setAudioLevel(0);
    try {
      await sttProvider.stop();
    } catch (err) {
      // Ignore
    }
  };

  // Focus manual input
  const handleManualInputFocus = () => {
    const el = document.getElementById('voice-transcript-input');
    if (el) {
      el.focus();
    }
  };

  // Analyze Answer action
  const handleAnalyzeAnswer = async () => {
    if (!activeProject || !selectedPrompt) return;
    if (!transcript.trim()) {
      showToast('Please record or enter an answer before analyzing.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setMicError(null);

    try {
      const session = await voicePracticeService.analyzeResponse(
        activeProject.id,
        activeProject.name,
        selectedPrompt,
        transcript,
        elapsedSeconds > 0 ? elapsedSeconds : Math.round(transcript.split(' ').length / 2.5),
        projectContext
      );

      if (session.result) {
        setLatestResult(session.result);
        // Refresh history
        setHistorySessions(voiceSessionRepository.getSessions(activeProject.id));
        showToast('Evaluation complete! Evidence registered to Readiness.', 'success');
      }
    } catch (err: any) {
      console.error('[VoicePracticePage] Analysis failed:', err);
      showToast(`Analysis error: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Select past session from history modal
  const handleSelectSessionFromHistory = (session: VoicePracticeSession) => {
    setActiveMode(session.prompt.mode);
    setSelectedPrompt(session.prompt);
    setTranscript(session.transcript);
    setElapsedSeconds(session.durationSeconds);
    if (session.result) {
      setLatestResult(session.result);
    }
    showToast(`Loaded voice practice attempt from ${new Date(session.createdAt).toLocaleDateString()}`, 'info');
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!activeProject) return;
    voiceSessionRepository.deleteSession(activeProject.id, sessionId);
    setHistorySessions(voiceSessionRepository.getSessions(activeProject.id));
    showToast('Practice session removed from history.', 'info');
  };

  const handleClearAllHistory = () => {
    if (!activeProject) return;
    voiceSessionRepository.clearSessions(activeProject.id);
    setHistorySessions([]);
    showToast('Voice practice history cleared.', 'info');
  };

  // If no project active
  if (!activeProject) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 mb-4 shadow-lg">
          <Mic className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">No Active Project Selected</h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          Voice Practice requires an active project to synthesize grounded prompts, evaluate technical accuracy, and generate readiness evidence.
        </p>
        <button
          type="button"
          onClick={onNavigateToProject}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Select or Open Project</span>
        </button>
      </div>
    );
  }

  const activeProvider = aiProviderRegistry.getActiveProvider();
  const providerName = activeProvider?.name || 'Google Gemini (Server Enclave)';
  const currentPrompts = promptsByMode[activeMode] || [];

  return (
    <div className="w-full min-h-full bg-[#0a0b10] text-zinc-100 flex flex-col p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Mic className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              Voice Practice
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
              Verbal Defense
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Practice verbally defending <strong>{activeProject.name}</strong> under real competition time constraints with grounded AI feedback.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <SnapdragonBadge />

          {/* Active project badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-zinc-200">{activeProject.name}</span>
            {activeProject.isDemo && (
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono">
                Demo
              </span>
            )}
          </div>

          {/* History Button */}
          <button
            type="button"
            id="btn-voice-history"
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-medium transition-colors"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>History ({historySessions.length})</span>
          </button>

          {/* Go to Readiness */}
          {onNavigateToReadiness && (
            <button
              type="button"
              id="btn-nav-readiness-from-voice"
              onClick={onNavigateToReadiness}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-xs font-medium transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Readiness Report</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Privacy Banner */}
      <VoicePrivacyBanner providerName={providerName} isSupported={isSttSupported} />

      {/* 3. Practice Mode Selector */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Select Practice Mode
        </div>
        <VoiceModeSelector
          activeMode={activeMode}
          onSelectMode={handleSelectMode}
          disabled={isRecording || isAnalyzing}
        />
      </div>

      {/* 4. Active Prompt Card */}
      {selectedPrompt && (
        <VoicePromptCard
          currentPrompt={selectedPrompt}
          availablePrompts={currentPrompts}
          onSelectPrompt={(p) => {
            setSelectedPrompt(p);
            setTranscript('');
            setLatestResult(null);
          }}
          disabled={isRecording || isAnalyzing}
        />
      )}

      {/* 5. Recorder & Transcript Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recorder Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <VoiceRecorderPanel
            isRecording={isRecording}
            elapsedSeconds={elapsedSeconds}
            maxDurationSeconds={selectedPrompt?.maxDurationSeconds || 180}
            audioLevel={audioLevel}
            sttSupported={isSttSupported}
            unavailabilityReason={unavailabilityReason}
            micError={micError}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onManualInputFocus={handleManualInputFocus}
            disabled={isAnalyzing}
          />

          {/* Quick tips card */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-xs text-zinc-400 space-y-2">
            <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Competition Tip
            </div>
            <p className="text-[11px] leading-relaxed">
              Judges quickly detect memorized marketing speeches. Ground your verbal answers in specific components, files, and architectural design choices from your codebase.
            </p>
          </div>
        </div>

        {/* Transcript & Evaluation Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <VoiceTranscriptPanel
            transcript={transcript}
            onChangeTranscript={setTranscript}
            onClearTranscript={() => {
              setTranscript('');
              setLatestResult(null);
            }}
            onAnalyzeAnswer={handleAnalyzeAnswer}
            isAnalyzing={isAnalyzing}
            isRecording={isRecording}
            durationSeconds={elapsedSeconds}
          />

          {/* AI Result Card */}
          {latestResult && (
            <VoiceResultCard
              result={latestResult}
              onNavigateToReadiness={() => {
                if (onNavigateToReadiness) onNavigateToReadiness();
              }}
              onPracticeAgain={() => {
                setTranscript('');
                setLatestResult(null);
                setElapsedSeconds(0);
              }}
            />
          )}
        </div>
      </div>

      {/* History Modal */}
      <VoiceHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={historySessions}
        onSelectSession={handleSelectSessionFromHistory}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
};
