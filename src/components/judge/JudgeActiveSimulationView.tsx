import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Send,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Shield,
  HelpCircle,
  FileCode,
  ArrowRight,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { JudgeSession, QuestionAttempt, AnswerEvaluation } from '../../types/judge';

interface JudgeActiveSimulationViewProps {
  session: JudgeSession;
  currentAttempt: QuestionAttempt | null;
  isLoadingQuestion: boolean;
  isEvaluating: boolean;
  evaluationError: string | null;
  onSubmitAnswer: (answer: string) => void;
  onSkipQuestion: () => void;
  onRetryEvaluation: () => void;
  onNextQuestion: () => void;
  onFinishSimulation: () => void;
  onRequestExit: () => void;
}

export const JudgeActiveSimulationView: React.FC<JudgeActiveSimulationViewProps> = ({
  session,
  currentAttempt,
  isLoadingQuestion,
  isEvaluating,
  evaluationError,
  onSubmitAnswer,
  onSkipQuestion,
  onRetryEvaluation,
  onNextQuestion,
  onFinishSimulation,
  onRequestExit,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [showWhyAsked, setShowWhyAsked] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const totalSeconds = parseInt(session.config.sessionLength, 10) * 60;
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync answerInput if returning to an existing attempt with an answer
  useEffect(() => {
    if (currentAttempt?.answer) {
      setAnswerInput(currentAttempt.answer);
    } else {
      setAnswerInput('');
    }
    setShowWhyAsked(false);
  }, [currentAttempt?.id]);

  // Focus textarea when new question arrives
  useEffect(() => {
    if (!currentAttempt?.evaluation && !isLoadingQuestion && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentAttempt?.id, currentAttempt?.evaluation, isLoadingQuestion]);

  // Real-time Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const totalSeconds = parseInt(session.config.sessionLength, 10) * 60;
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [session.startedAt, session.config.sessionLength]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isTimerExpired = secondsRemaining === 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (answerInput.trim() && !isEvaluating && !currentAttempt?.evaluation) {
        onSubmitAnswer(answerInput.trim());
      }
    }
  };

  const currentIdx = session.attempts.length;
  const evaluation = currentAttempt?.evaluation;
  const wordCount = answerInput.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Simulation Header / Cockpit */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-100 font-bold">
                Simulation Active
              </span>
              <Badge variant="warning" size="sm">
                Question {currentIdx}
              </Badge>
              <Badge variant="outline" size="sm">
                {currentAttempt?.question.difficulty.toUpperCase() || session.config.difficulty.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Focus: <span className="text-zinc-200 capitalize">{session.config.focus}</span> • Style: <span className="text-zinc-200 capitalize">{session.config.questionStyle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs ${
              isTimerExpired
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : secondsRemaining < 60
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsRemaining)} remaining</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestExit}
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            End Simulation
          </Button>
        </div>
      </div>

      {/* Timer Expired Notice */}
      {isTimerExpired && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Session time has concluded. You may answer the current question or wrap up the defense now.</span>
          </div>
          <Button variant="danger" size="xs" onClick={onFinishSimulation}>
            Conclude & View Summary
          </Button>
        </div>
      )}

      {/* Question Card */}
      <Card variant="default" className="border-zinc-800 bg-zinc-950/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-mono text-amber-400 font-semibold tracking-wide uppercase">
                Simulated Judge (Technical Review Committee)
              </span>
            </div>
            {currentAttempt?.question.category && (
              <Badge variant="neutral" size="sm">
                {currentAttempt.question.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingQuestion ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <p className="text-xs">Judge is formulating the next adaptive question from project files...</p>
            </div>
          ) : currentAttempt ? (
            <>
              <blockquote className="text-base md:text-lg text-zinc-100 font-medium leading-relaxed border-l-2 border-amber-400 pl-4 py-1">
                &ldquo;{currentAttempt.question.question}&rdquo;
              </blockquote>

              {/* Rationale Toggle */}
              {currentAttempt.question.whyAsked && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowWhyAsked(!showWhyAsked)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Why the judge asks this</span>
                    {showWhyAsked ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showWhyAsked && (
                    <div className="mt-2 p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed animate-in fade-in duration-150">
                      {currentAttempt.question.whyAsked}
                    </div>
                  )}
                </div>
              )}

              {/* Source References */}
              {currentAttempt.question.sourceReferences && currentAttempt.question.sourceReferences.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-900 text-xs text-zinc-400">
                  <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-400">Relevant project sources:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentAttempt.question.sourceReferences.map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px]"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Answer & Evaluation Stage */}
      {!evaluation ? (
        /* User Response Input */
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Your Technical Defense</CardTitle>
              <span className="text-xs text-zinc-400 font-mono">
                {wordCount} words • {answerInput.length} chars
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              ref={textareaRef}
              id="judge-answer-input"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isEvaluating || isLoadingQuestion}
              placeholder="Explain your answer... Walk through your engineering rationale, architectural boundaries, or data flow."
              rows={5}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 transition-all resize-y"
            />

            {/* Evaluation Error Banner with user answer preserved */}
            {evaluationError && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/60 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Your answer was saved, but the judge couldn't evaluate it: {evaluationError}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={onRetryEvaluation}
                    icon={<RotateCcw className="w-3 h-3" />}
                  >
                    Retry Evaluation
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={onNextQuestion}
                    icon={<ArrowRight className="w-3 h-3" />}
                  >
                    Continue to Next
                  </Button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-xs text-zinc-400">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px]">Cmd+Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px]">Ctrl+Enter</kbd> to submit
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  id="btn-skip-question"
                  onClick={onSkipQuestion}
                  disabled={isEvaluating || isLoadingQuestion}
                  icon={<SkipForward className="w-3.5 h-3.5" />}
                >
                  Skip Question
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  id="btn-submit-answer"
                  onClick={() => onSubmitAnswer(answerInput.trim())}
                  disabled={!answerInput.trim() || isEvaluating || isLoadingQuestion}
                  isLoading={isEvaluating}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  {isEvaluating ? 'Judge Reviewing...' : 'Submit Answer'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Evaluation Feedback Card */
        <Card variant="default" className="border-zinc-700 bg-zinc-900/90 shadow-md animate-in fade-in duration-200">
          <CardHeader className="border-b border-zinc-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm">Judge's Technical Assessment</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {evaluation.nextDifficultyRecommendation && (
                  <Badge variant="outline" size="sm">
                    Next recommended depth: {evaluation.nextDifficultyRecommendation}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Overall Verdict */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
              <span className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-1">
                Assessment
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                {evaluation.overallAssessment}
              </p>
            </div>

            {/* Strengths & Missing Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Strengths</span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps / What was missing */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono uppercase">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>What Was Missing / Gaps</span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {evaluation.gaps.length > 0 ? (
                    evaluation.gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-500 italic">No major omissions detected.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Corrections if any */}
            {evaluation.corrections && evaluation.corrections.length > 0 && (
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/40 space-y-1.5 text-xs text-zinc-300">
                <span className="text-red-400 font-semibold font-mono uppercase block">
                  Grounding & Discrepancies
                </span>
                {evaluation.corrections.map((corr, idx) => (
                  <p key={idx} className="leading-relaxed">
                    • {corr}
                  </p>
                ))}
              </div>
            )}

            {/* Project Evidence */}
            {evaluation.evidence && evaluation.evidence.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-400 space-y-1">
                <span className="text-zinc-500 font-mono uppercase text-[11px] block">
                  Project Evidence Citations
                </span>
                {evaluation.evidence.map((ev, idx) => (
                  <p key={idx} className="text-zinc-300 font-mono text-[11px]">
                    • {ev}
                  </p>
                ))}
              </div>
            )}

            {/* Suggested Improvement */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>How to Defend This Live</span>
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {evaluation.suggestedImprovement}
              </p>
            </div>

            {/* Progress / Next Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={onFinishSimulation}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Finish Simulation
              </Button>

              <Button
                variant="primary"
                size="sm"
                id="btn-next-question"
                onClick={onNextQuestion}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Continue to Next Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
