import React, { useState, useEffect, useCallback } from 'react';
import { Gavel } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import {
  JudgeConfig,
  JudgeSession,
  QuestionAttempt,
  JudgeDifficulty,
} from '../types/judge';
import { AIProcessingMode } from '../types/ai';
import { judgeSessionRepository } from '../services/judge/JudgeSessionRepository';
import { judgeSimulationService } from '../services/judge/JudgeSimulationService';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';
import { JudgeSetupView } from '../components/judge/JudgeSetupView';
import { JudgeActiveSimulationView } from '../components/judge/JudgeActiveSimulationView';
import { JudgeSummaryView } from '../components/judge/JudgeSummaryView';
import { JudgeExitModal } from '../components/judge/JudgeExitModal';
import { SnapdragonBadge } from '../components/ui/SnapdragonBadge';


interface JudgeModePageProps {
  onNavigateToProject?: () => void;
  onNavigateToSettings?: () => void;
}

export const JudgeModePage: React.FC<JudgeModePageProps> = ({
  onNavigateToProject,
  onNavigateToSettings,
}) => {
  const { activeProject, hasProject, loadDemoProject, projectContextData } = useProject();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'setup' | 'simulating' | 'summary'>('setup');
  const [config, setConfig] = useState<JudgeConfig>({
    difficulty: 'technical',
    focus: 'mixed',
    sessionLength: '10',
    questionStyle: 'mixed',
  });

  const [activeSession, setActiveSession] = useState<JudgeSession | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuestionAttempt | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const [previousSessions, setPreviousSessions] = useState<JudgeSession[]>([]);
  const [processingMode, setProcessingMode] = useState<AIProcessingMode>('remote');
  const [providerName, setProviderName] = useState('Gemini 2.5 Flash');

  // Load previous sessions and active AI provider info
  useEffect(() => {
    if (activeProject) {
      const saved = judgeSessionRepository.getSessions(activeProject.id);
      setPreviousSessions(saved);
    } else {
      setPreviousSessions([]);
    }

    const provider = aiProviderRegistry.getActiveProvider();
    if (provider) {
      setProviderName(provider.name);
      setProcessingMode(provider.capabilities.isLocal ? 'local' : 'remote');
    }
  }, [activeProject?.id]);

  const hasSufficientContext = Boolean(
    activeProject &&
      ((activeProject.files && activeProject.files.length > 0) ||
        projectContextData.problem ||
        projectContextData.solution ||
        (projectContextData.technologies && projectContextData.technologies.length > 0))
  );

  // START SIMULATION
  const handleStartSimulation = async () => {
    if (!activeProject || !hasSufficientContext) {
      toast.warning('Context Required', 'Please load project files before starting Judge Mode.');
      return;
    }

    const newSession: JudgeSession = {
      id: `judge-${Date.now()}`,
      projectId: activeProject.id,
      startedAt: new Date().toISOString(),
      config,
      attempts: [],
      currentAttemptIndex: 0,
      status: 'active',
    };

    setActiveSession(newSession);
    setViewMode('simulating');
    setIsLoadingQuestion(true);
    setEvaluationError(null);

    try {
      const firstQuestion = await judgeSimulationService.getNextQuestion(
        activeProject.id,
        activeProject.name || activeProject.title || 'Project',
        config,
        [],
        projectContextData
      );

      const firstAttempt: QuestionAttempt = {
        id: `att-${Date.now()}`,
        question: firstQuestion,
        askedAt: new Date().toISOString(),
      };

      const updatedSession: JudgeSession = {
        ...newSession,
        attempts: [firstAttempt],
      };

      setActiveSession(updatedSession);
      setCurrentAttempt(firstAttempt);
      judgeSessionRepository.saveSession(updatedSession);
    } catch (err: any) {
      console.error('[JudgeModePage] Error generating initial question:', err);
      toast.error('Question Generation Failed', err.message || 'Failed to contact judge engine.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // SUBMIT ANSWER
  const handleSubmitAnswer = async (answer: string) => {
    if (!activeProject || !activeSession || !currentAttempt) return;

    setIsEvaluating(true);
    setEvaluationError(null);

    // Persist answer immediately so user input is never lost
    const answeredAttempt: QuestionAttempt = {
      ...currentAttempt,
      answer,
      answeredAt: new Date().toISOString(),
    };

    const updatedAttempts = activeSession.attempts.map((a) =>
      a.id === answeredAttempt.id ? answeredAttempt : a
    );

    const sessionWithAnswer: JudgeSession = {
      ...activeSession,
      attempts: updatedAttempts,
    };

    setActiveSession(sessionWithAnswer);
    setCurrentAttempt(answeredAttempt);
    judgeSessionRepository.saveSession(sessionWithAnswer);

    try {
      const evaluation = await judgeSimulationService.evaluateAnswer(
        activeProject.id,
        activeProject.name || activeProject.title || 'Project',
        currentAttempt.question,
        answer,
        activeSession.config,
        projectContextData
      );

      const evaluatedAttempt: QuestionAttempt = {
        ...answeredAttempt,
        evaluation,
      };

      const sessionWithEvaluation: JudgeSession = {
        ...sessionWithAnswer,
        attempts: sessionWithAnswer.attempts.map((a) =>
          a.id === evaluatedAttempt.id ? evaluatedAttempt : a
        ),
      };

      setActiveSession(sessionWithEvaluation);
      setCurrentAttempt(evaluatedAttempt);
      judgeSessionRepository.saveSession(sessionWithEvaluation);
    } catch (err: any) {
      console.error('[JudgeModePage] Evaluation error:', err);
      setEvaluationError(err.message || 'Judge evaluation server timeout.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // RETRY EVALUATION
  const handleRetryEvaluation = () => {
    if (currentAttempt?.answer) {
      handleSubmitAnswer(currentAttempt.answer);
    }
  };

  // SKIP QUESTION
  const handleSkipQuestion = async () => {
    if (!activeProject || !activeSession || !currentAttempt) return;

    const skippedAttempt: QuestionAttempt = {
      ...currentAttempt,
      skipped: true,
      answeredAt: new Date().toISOString(),
    };

    const updatedSession: JudgeSession = {
      ...activeSession,
      attempts: activeSession.attempts.map((a) =>
        a.id === skippedAttempt.id ? skippedAttempt : a
      ),
    };

    setActiveSession(updatedSession);
    judgeSessionRepository.saveSession(updatedSession);

    // Move to next question
    await handleFetchNextQuestion(updatedSession);
  };

  // NEXT QUESTION (Adaptive)
  const handleFetchNextQuestion = async (baseSession: JudgeSession) => {
    if (!activeProject) return;

    setIsLoadingQuestion(true);
    setEvaluationError(null);

    // Adapt difficulty if last evaluation recommended it
    const lastAttempt = baseSession.attempts[baseSession.attempts.length - 1];
    let currentConfig = baseSession.config;
    if (lastAttempt?.evaluation?.nextDifficultyRecommendation) {
      currentConfig = {
        ...currentConfig,
        difficulty: lastAttempt.evaluation.nextDifficultyRecommendation as JudgeDifficulty,
      };
    }

    try {
      const nextQuestion = await judgeSimulationService.getNextQuestion(
        activeProject.id,
        activeProject.name || activeProject.title || 'Project',
        currentConfig,
        baseSession.attempts,
        projectContextData
      );

      const nextAttempt: QuestionAttempt = {
        id: `att-${Date.now()}`,
        question: nextQuestion,
        askedAt: new Date().toISOString(),
      };

      const updatedSession: JudgeSession = {
        ...baseSession,
        config: currentConfig,
        attempts: [...baseSession.attempts, nextAttempt],
        currentAttemptIndex: baseSession.attempts.length,
      };

      setActiveSession(updatedSession);
      setCurrentAttempt(nextAttempt);
      judgeSessionRepository.saveSession(updatedSession);
    } catch (err: any) {
      console.error('[JudgeModePage] Failed to fetch next question:', err);
      toast.error('Question Error', err.message || 'Unable to load next judge question.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleNextQuestion = () => {
    if (activeSession) {
      handleFetchNextQuestion(activeSession);
    }
  };

  // FINISH SIMULATION
  const handleFinishSimulation = async () => {
    if (!activeProject || !activeSession) return;

    setIsLoadingQuestion(true);

    try {
      const { summary, readinessEvidence } = await judgeSimulationService.summarizeSession(
        activeProject.id,
        activeProject.name || activeProject.title || 'Project',
        activeSession.config,
        activeSession.attempts,
        projectContextData
      );

      const completedSession: JudgeSession = {
        ...activeSession,
        status: 'completed',
        endedAt: new Date().toISOString(),
        summary,
        readinessEvidence,
      };

      setActiveSession(completedSession);
      judgeSessionRepository.saveSession(completedSession);
      setPreviousSessions(judgeSessionRepository.getSessions(activeProject.id));
      setViewMode('summary');
      toast.success(
        'Simulation Complete',
        'Defense evaluation synthesized and stored for Readiness Report.'
      );
    } catch (err: any) {
      console.error('[JudgeModePage] Summarize error:', err);
      // Fallback completion without remote synthesis
      const completedSession: JudgeSession = {
        ...activeSession,
        status: 'completed',
        endedAt: new Date().toISOString(),
      };
      setActiveSession(completedSession);
      judgeSessionRepository.saveSession(completedSession);
      setPreviousSessions(judgeSessionRepository.getSessions(activeProject.id));
      setViewMode('summary');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // EXIT MODAL CONFIRMATION
  const handleConfirmExit = () => {
    if (activeSession && activeProject) {
      const closedSession: JudgeSession = {
        ...activeSession,
        status: activeSession.attempts.some((a) => a.answer) ? 'completed' : 'abandoned',
        endedAt: new Date().toISOString(),
      };
      judgeSessionRepository.saveSession(closedSession);
      setPreviousSessions(judgeSessionRepository.getSessions(activeProject.id));
    }
    setShowExitModal(false);
    setViewMode('setup');
  };

  // SELECT PAST SESSION
  const handleSelectPastSession = (session: JudgeSession) => {
    setActiveSession(session);
    setViewMode('summary');
  };

  // DELETE PAST SESSION
  const handleDeletePastSession = (sessionId: string) => {
    if (!activeProject) return;
    judgeSessionRepository.deleteSession(activeProject.id, sessionId);
    setPreviousSessions(judgeSessionRepository.getSessions(activeProject.id));
    toast.info('Session Removed', 'Historical simulation record deleted.');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">Judge Mode</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Adaptive Defense Simulator
              </span>
              <SnapdragonBadge />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Adaptive project presentation defense simulator with skeptical, project-grounded evaluation.
            </p>
          </div>

          {activeProject && (
            <span className="text-xs font-mono text-zinc-400">
              Project Context:{' '}
              <span className="text-zinc-200">{activeProject.name || activeProject.title}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Views */}
      {viewMode === 'setup' && (
        <JudgeSetupView
          activeProject={activeProject}
          hasProject={hasProject}
          hasSufficientContext={hasSufficientContext}
          config={config}
          onChangeConfig={setConfig}
          onStartSimulation={handleStartSimulation}
          previousSessions={previousSessions}
          onSelectPastSession={handleSelectPastSession}
          onDeletePastSession={handleDeletePastSession}
          onOpenDemoProject={loadDemoProject}
          onNavigateToFiles={onNavigateToProject}
          processingMode={processingMode}
          providerName={providerName}
        />
      )}

      {viewMode === 'simulating' && activeSession && (
        <JudgeActiveSimulationView
          session={activeSession}
          currentAttempt={currentAttempt}
          isLoadingQuestion={isLoadingQuestion}
          isEvaluating={isEvaluating}
          evaluationError={evaluationError}
          onSubmitAnswer={handleSubmitAnswer}
          onSkipQuestion={handleSkipQuestion}
          onRetryEvaluation={handleRetryEvaluation}
          onNextQuestion={handleNextQuestion}
          onFinishSimulation={handleFinishSimulation}
          onRequestExit={() => setShowExitModal(true)}
        />
      )}

      {viewMode === 'summary' && activeSession && (
        <JudgeSummaryView
          session={activeSession}
          onStartNewSimulation={() => {
            setViewMode('setup');
          }}
          onBackToSetup={() => {
            setViewMode('setup');
          }}
        />
      )}

      {/* Exit Confirmation Modal */}
      <JudgeExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={handleConfirmExit}
      />
    </div>
  );
};
