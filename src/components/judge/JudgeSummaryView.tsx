import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { JudgeSession } from '../../types/judge';

interface JudgeSummaryViewProps {
  session: JudgeSession;
  onStartNewSimulation: () => void;
  onBackToSetup: () => void;
}

export const JudgeSummaryView: React.FC<JudgeSummaryViewProps> = ({
  session,
  onStartNewSimulation,
  onBackToSetup,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);

  const summary = session.summary;
  const readiness = session.readinessEvidence;
  const attempted = session.attempts.filter((a) => !a.skipped && a.answer).length;
  const skipped = session.attempts.filter((a) => a.skipped).length;

  const durationMin = session.endedAt
    ? Math.round(
        (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
      )
    : parseInt(session.config.sessionLength, 10);

  return (
    <div className="space-y-6">
      {/* Session Concluded Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100">Simulation Concluded</h2>
              <Badge variant="success" size="sm">
                Evidence Preserved
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {attempted} questions defended • {skipped} skipped • {durationMin} minutes simulation window
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBackToSetup}>
            Back to Setup
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onStartNewSimulation}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Start New Simulation
          </Button>
        </div>
      </div>

      {/* Metrics & High-Level Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Major Strengths */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <CardTitle className="text-xs">Demonstrated Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-zinc-300">
              {summary?.majorStrengths && summary.majorStrengths.length > 0 ? (
                summary.majorStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500 italic">No specific strengths documented.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Major Gaps */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono uppercase">
              <AlertCircle className="w-4 h-4" />
              <CardTitle className="text-xs">Identified Vulnerabilities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-zinc-300">
              {summary?.majorGaps && summary.majorGaps.length > 0 ? (
                summary.majorGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{gap}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500 italic">No critical omissions recorded.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Topics Requiring Practice */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs font-mono uppercase">
              <TrendingUp className="w-4 h-4" />
              <CardTitle className="text-xs">Drill Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-xs text-zinc-300">
              {summary?.topicsRequiringPractice && summary.topicsRequiringPractice.length > 0 ? (
                summary.topicsRequiringPractice.map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{topic}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500 italic">Continue general technical review.</li>
              )}
            </ul>

            {summary?.recommendedNextStep && (
              <div className="mt-3 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200 block mb-0.5">Next step:</span>
                <span>{summary.recommendedNextStep}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Readiness Evidence Box (Preps for Segment 8) */}
      {readiness && (
        <Card variant="default" className="border-sky-900/40 bg-zinc-900/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                <CardTitle>Collected Readiness Evidence</CardTitle>
              </div>
              <Badge variant="info" size="sm">
                Feeds Readiness Report
              </Badge>
            </div>
            <CardDescription>
              Objective qualitative evidence synthesized from this defense simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-300">Project Understanding:</span>
                <p className="text-zinc-400 leading-relaxed">{readiness.projectUnderstanding}</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-300">Problem & Solution Clarity:</span>
                <p className="text-zinc-400 leading-relaxed">{readiness.problemSolutionClarity}</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-300">Technical Defense:</span>
                <p className="text-zinc-400 leading-relaxed">{readiness.technicalDefense}</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-300">Architecture Explanation:</span>
                <p className="text-zinc-400 leading-relaxed">{readiness.architectureExplanation}</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-300">Question Handling:</span>
                <p className="text-zinc-400 leading-relaxed">{readiness.questionHandling}</p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-300">Communication Clarity:</span>
                <p className="text-zinc-400 leading-relaxed">{readiness.communicationClarity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Collapsible */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Session Transcript ({session.attempts.length} items)</CardTitle>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowTranscript(!showTranscript)}
              icon={showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            >
              {showTranscript ? 'Collapse' : 'Expand All'}
            </Button>
          </div>
        </CardHeader>
        {showTranscript && (
          <CardContent className="divide-y divide-zinc-800/80 pt-0">
            {session.attempts.map((att, idx) => (
              <div key={att.id} className="py-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-zinc-400 font-semibold">
                    Question {idx + 1} ({att.question.category})
                  </span>
                  <Badge variant={att.skipped ? 'outline' : 'warning'} size="sm">
                    {att.skipped ? 'SKIPPED' : att.question.difficulty.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-zinc-200 font-medium text-sm leading-relaxed">
                  &ldquo;{att.question.question}&rdquo;
                </p>

                {att.skipped ? (
                  <p className="text-zinc-500 italic">User skipped this question.</p>
                ) : (
                  <>
                    <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                      <span className="font-semibold text-zinc-400 block mb-1">Your Defense:</span>
                      <p className="text-zinc-300 leading-relaxed">{att.answer}</p>
                    </div>

                    {att.evaluation && (
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 space-y-1.5">
                        <span className="font-semibold text-amber-400 block">Judge Assessment:</span>
                        <p className="text-zinc-300">{att.evaluation.overallAssessment}</p>
                        {att.evaluation.suggestedImprovement && (
                          <p className="text-zinc-400 italic pt-1">
                            Tip: {att.evaluation.suggestedImprovement}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
