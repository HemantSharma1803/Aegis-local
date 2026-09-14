import React from 'react';
import {
  Flame,
  Target,
  Clock,
  HelpCircle,
  Play,
  FolderPlus,
  Shield,
  History,
  Calendar,
  ChevronRight,
  Trash2,
  Cpu,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  JudgeConfig,
  JudgeDifficulty,
  JudgeFocus,
  JudgeSessionLength,
  QuestionStyle,
  JudgeSession,
} from '../../types/judge';
import { Project } from '../../types';
import { AIProcessingMode } from '../../types/ai';

interface JudgeSetupViewProps {
  activeProject: Project | null;
  hasProject: boolean;
  hasSufficientContext: boolean;
  config: JudgeConfig;
  onChangeConfig: (newConfig: JudgeConfig) => void;
  onStartSimulation: () => void;
  previousSessions: JudgeSession[];
  onSelectPastSession: (session: JudgeSession) => void;
  onDeletePastSession: (sessionId: string) => void;
  onOpenDemoProject?: () => void;
  onNavigateToFiles?: () => void;
  processingMode: AIProcessingMode;
  providerName: string;
}

export const JudgeSetupView: React.FC<JudgeSetupViewProps> = ({
  activeProject,
  hasProject,
  hasSufficientContext,
  config,
  onChangeConfig,
  onStartSimulation,
  previousSessions,
  onSelectPastSession,
  onDeletePastSession,
  onOpenDemoProject,
  onNavigateToFiles,
  processingMode,
  providerName,
}) => {
  const difficulties: Array<{ id: JudgeDifficulty; label: string; desc: string }> = [
    {
      id: 'easy',
      label: 'Easy',
      desc: 'Supportive inquiry, focuses on high-level goals and basic workflow.',
    },
    {
      id: 'technical',
      label: 'Technical',
      desc: 'Rigorous deep-dive into edge cases, latency, and design trade-offs.',
    },
    {
      id: 'challenging',
      label: 'Challenging',
      desc: 'Skeptical cross-examination aggressively attacking potential vulnerabilities.',
    },
  ];

  const foci: Array<{ id: JudgeFocus; label: string }> = [
    { id: 'project', label: 'Project' },
    { id: 'problem-solution', label: 'Problem & Solution' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'technology', label: 'Technology' },
    { id: 'security', label: 'Security' },
    { id: 'aiml', label: 'AI/ML' },
    { id: 'trade-offs', label: 'Trade-offs' },
    { id: 'mixed', label: 'Mixed' },
  ];

  const sessionLengths: Array<{ id: JudgeSessionLength; label: string }> = [
    { id: '5', label: '5 min' },
    { id: '10', label: '10 min' },
    { id: '15', label: '15 min' },
  ];

  const questionStyles: Array<{ id: QuestionStyle; label: string; desc: string }> = [
    {
      id: 'direct',
      label: 'Direct',
      desc: 'Concise, focused questions asking for specific technical rationale.',
    },
    {
      id: 'cross-examination',
      label: 'Cross-examination',
      desc: 'Adversarial inquiry that aggressively probes claims and omissions.',
    },
    {
      id: 'mixed',
      label: 'Mixed Panel',
      desc: 'Varied questions from a diverse technical committee.',
    },
  ];

  if (!hasProject) {
    return (
      <Card variant="default" className="text-center p-8 max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Open a project before starting Judge Mode.
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Judge Mode evaluates your actual project implementation and architecture. Select or create a project to calibrate the simulated defense.
          </p>
        </div>
        {onOpenDemoProject && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenDemoProject}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Open Aegis Journal Demo
          </Button>
        )}
      </Card>
    );
  }

  if (!hasSufficientContext) {
    return (
      <Card variant="default" className="text-center p-8 max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center border border-sky-500/20">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Add more project material before starting a meaningful simulation.
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
            The judge needs technical source files, architecture documents, or notes to construct authentic, non-hallucinated defense questions.
          </p>
        </div>
        {onNavigateToFiles && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToFiles}
            icon={<FolderPlus className="w-3.5 h-3.5" />}
          >
            Import Project Files
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Project Context & Engine Status */}
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="font-semibold text-zinc-100">Active Project:</span>
          <span className="text-zinc-200 font-mono bg-zinc-800/60 px-2 py-0.5 rounded">
            {activeProject?.name || activeProject?.title}
          </span>
          {activeProject?.files && (
            <span className="text-zinc-500">({activeProject.files.length} indexed files)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={processingMode === 'remote' ? 'info' : 'success'} size="sm">
            <Cpu className="w-3 h-3 mr-1" />
            {providerName}
          </Badge>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Strict Project Grounding</span>
          </div>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Difficulty */}
        <Card variant="default" className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <CardTitle>Difficulty</CardTitle>
            </div>
            <CardDescription>
              Calibrate the skepticism, technical depth, and scrutiny of the simulated committee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {difficulties.map((diff) => {
                const isSelected = config.difficulty === diff.id;
                return (
                  <div
                    key={diff.id}
                    id={`diff-option-${diff.id}`}
                    onClick={() => onChangeConfig({ ...config, difficulty: diff.id })}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-zinc-800/90 border-zinc-300 shadow-xs'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-white' : 'text-zinc-200'
                        }`}
                      >
                        {diff.label}
                      </span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{diff.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Focus */}
        <Card variant="default" className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-400" />
              <CardTitle>Focus</CardTitle>
            </div>
            <CardDescription>
              Direct the line of questioning towards specific technical dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {foci.map((f) => {
                const isSelected = config.focus === f.id;
                return (
                  <button
                    key={f.id}
                    id={`focus-btn-${f.id}`}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, focus: f.id })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-white font-semibold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Session length */}
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <CardTitle>Session Length</CardTitle>
            </div>
            <CardDescription>Timed interview rehearsal window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {sessionLengths.map((len) => {
                const isSelected = config.sessionLength === len.id;
                return (
                  <button
                    key={len.id}
                    id={`length-btn-${len.id}`}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, sessionLength: len.id })}
                    className={`py-2 text-center rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-white font-semibold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {len.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Question Style */}
        <Card variant="default" className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <CardTitle>Question Style</CardTitle>
            </div>
            <CardDescription>
              Select the conversational posture and cross-examination style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {questionStyles.map((style) => {
                const isSelected = config.questionStyle === style.id;
                return (
                  <div
                    key={style.id}
                    id={`style-btn-${style.id}`}
                    onClick={() => onChangeConfig({ ...config, questionStyle: style.id })}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-zinc-800/90 border-zinc-300 shadow-xs'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-white' : 'text-zinc-200'
                        }`}
                      >
                        {style.label}
                      </span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{style.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start Simulation Callout */}
      <div className="p-6 rounded-xl bg-zinc-900/70 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <span>Ready for Defense Simulation</span>
            <Badge variant="warning" size="sm">
              Adaptive
            </Badge>
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            The simulation dynamically chooses follow-up questions based on your answers and evaluates your defense against actual project files. Evidence will be collected for your Readiness Report.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          id="btn-start-simulation"
          onClick={onStartSimulation}
          icon={<Play className="w-4 h-4" />}
        >
          Start Simulation
        </Button>
      </div>

      {/* Previous Sessions History */}
      {previousSessions.length > 0 && (
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                <CardTitle>Previous Sessions ({previousSessions.length})</CardTitle>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Scoped to active project</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-800/60">
              {previousSessions.map((session) => {
                const dateStr = new Date(session.startedAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const attempted = session.attempts.filter((a) => !a.skipped && a.answer).length;
                const skipped = session.attempts.filter((a) => a.skipped).length;

                return (
                  <div
                    key={session.id}
                    className="py-3 flex items-center justify-between gap-4 group"
                  >
                    <div
                      onClick={() => onSelectPastSession(session)}
                      className="flex-1 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-200 font-medium">{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">
                          {session.config.difficulty.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {session.config.focus}
                        </Badge>
                        <span className="text-xs text-zinc-400 font-mono">
                          {session.config.sessionLength}m
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        <span>{attempted} answered</span>
                        {skipped > 0 && <span className="text-zinc-500"> • {skipped} skipped</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onSelectPastSession(session)}
                        icon={<ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
                      >
                        Review
                      </Button>
                      <button
                        title="Delete session record"
                        onClick={() => onDeletePastSession(session.id)}
                        className="p-1 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
