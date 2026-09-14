import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  PlayCircle,
  RotateCcw,
  Clock,
  History,
  Sparkles,
  HelpCircle,
  BookOpen,
  FolderGit2,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { ReadinessReport, CategoryAssessment } from '../types/readiness';
import { readinessService } from '../services/readiness/ReadinessService';
import { readinessReportRepository } from '../services/readiness/ReadinessReportRepository';
import { judgeSessionRepository } from '../services/judge/JudgeSessionRepository';
import { voiceSessionRepository } from '../services/voice/VoiceSessionRepository';
import { OverallReadinessCard } from '../components/readiness/OverallReadinessCard';
import { NextBestActionCard } from '../components/readiness/NextBestActionCard';
import { CategoryCard } from '../components/readiness/CategoryCard';
import { CategoryDetailModal } from '../components/readiness/CategoryDetailModal';
import { SessionComparisonCard } from '../components/readiness/SessionComparisonCard';
import { PracticeRecommendationsView } from '../components/readiness/PracticeRecommendationsView';
import { ReadinessHistoryModal } from '../components/readiness/ReadinessHistoryModal';

interface ReadinessPageProps {
  onNavigateToJudge: () => void;
  onNavigateToVoice?: () => void;
  onNavigateToPrepare?: () => void;
}

export const ReadinessPage: React.FC<ReadinessPageProps> = ({
  onNavigateToJudge,
  onNavigateToVoice,
  onNavigateToPrepare,
}) => {
  const { activeProject, hasProject, loadDemoProject, projectContextData } = useProject();
  const { toast } = useToast();

  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [allReports, setAllReports] = useState<ReadinessReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Category Modal State
  const [selectedCategory, setSelectedCategory] = useState<CategoryAssessment | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const loadProjectReadiness = useCallback(
    async (forceRefresh = false) => {
      if (!activeProject) {
        setReport(null);
        setAllReports([]);
        return;
      }

      const sessions = judgeSessionRepository.getSessions(activeProject.id);
      const voiceSessions = voiceSessionRepository.getSessions(activeProject.id);
      const hasMeaningfulSessions =
        sessions.some(
          (s) => s.attempts && s.attempts.length > 0 && s.attempts.some((a) => a.answer || a.skipped)
        ) ||
        voiceSessions.some((vs) => vs.result && vs.transcript && vs.transcript.trim().length > 0);

      const savedReports = readinessReportRepository.getReports(activeProject.id);
      setAllReports(savedReports);

      if (!forceRefresh && savedReports.length > 0) {
        setReport(savedReports[0]);
        return;
      }

      if (!hasMeaningfulSessions) {
        // Honest empty state: no sessions completed
        const emptyReport = await readinessService.generateReport(
          activeProject.id,
          activeProject.name || activeProject.title || 'Project'
        );
        setReport(emptyReport);
        return;
      }

      // Generate report from real sessions
      if (forceRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const newReport = await readinessService.generateReport(
          activeProject.id,
          activeProject.name || activeProject.title || 'Project',
          projectContextData
        );
        setReport(newReport);
        setAllReports(readinessReportRepository.getReports(activeProject.id));
      } catch (err: any) {
        console.error('[ReadinessPage] Failed to calculate readiness report:', err);
        toast.error('Assessment Error', 'Unable to synthesize presentation readiness.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeProject, projectContextData, toast]
  );

  useEffect(() => {
    loadProjectReadiness(false);
  }, [activeProject?.id]);

  const handleRefresh = async () => {
    if (!activeProject) return;
    await loadProjectReadiness(true);
    toast.success('Assessment Recalculated', 'Readiness metrics refreshed from latest simulation data.');
  };

  const handleSelectCategory = (cat: CategoryAssessment) => {
    setSelectedCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSelectHistoricalReport = (historicalReport: ReadinessReport) => {
    setReport(historicalReport);
    toast.info('Historical Report Loaded', `Viewing report from ${new Date(historicalReport.generatedAt).toLocaleDateString()}.`);
  };

  const handleDeleteReport = (reportId: string) => {
    if (!activeProject) return;
    readinessReportRepository.deleteReport(activeProject.id, reportId);
    const updated = readinessReportRepository.getReports(activeProject.id);
    setAllReports(updated);
    if (report?.id === reportId) {
      setReport(updated.length > 0 ? updated[0] : null);
    }
    toast.info('Report Removed', 'Assessment record deleted.');
  };

  const hasSessions = Boolean(
    report && report.overallLevel !== 'not-evaluated' && report.sessionsUsed.length > 0
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                Presentation Readiness
              </h1>
              <Badge variant={hasSessions ? 'info' : 'outline'} size="sm">
                {hasSessions ? 'Evidence-Based Report' : 'Diagnostic Baseline'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Objective technical readiness assessment synthesized from actual Judge Mode defense evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {allReports.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryModalOpen(true)}
                icon={<History className="w-3.5 h-3.5" />}
              >
                History ({allReports.length})
              </Button>
            )}

            {hasSessions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Refresh Assessment
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToJudge}
              icon={<PlayCircle className="w-3.5 h-3.5" />}
            >
              Launch Practice Session
            </Button>
          </div>
        </div>
      </div>

      {/* No Active Project */}
      {!hasProject && (
        <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-200">No Project Open</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Open a project or load the Aegis Journal demo project to start generating presentation readiness metrics.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadDemoProject}>
            Load Aegis Journal Demo
          </Button>
        </div>
      )}

      {/* Empty State: Project exists, but no completed judge sessions */}
      {hasProject && !hasSessions && (
        <div className="space-y-6">
          {/* Honest Empty State Banner */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-400 shrink-0" />
              <div>
                <p className="text-xs text-zinc-200 font-medium">
                  Complete a preparation session to generate your readiness report.
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Diagnostic scores require verified defense evidence from Judge Mode simulation reviews.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="outline" size="sm">
                No Evaluated Scores
              </Badge>
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToJudge}
                icon={<PlayCircle className="w-3.5 h-3.5" />}
              >
                Start Simulation
              </Button>
            </div>
          </div>

          {/* 5 Category Cards in Honest Not-Evaluated State */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report?.categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onSelect={() => handleSelectCategory(cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full Readiness Report: Real evidence exists */}
      {hasProject && hasSessions && report && (
        <div className="space-y-6">
          {/* Overall Readiness Card */}
          <OverallReadinessCard
            level={report.overallLevel}
            score={report.overallScore}
            explanation={report.overallExplanation}
            sessionsCount={report.sessionsUsed.length}
            evidenceCount={report.evidence.length}
            providerName={report.providerName}
            processingMode={report.processingMode}
          />

          {/* Next Best Action Banner */}
          {report.nextBestAction && (
            <NextBestActionCard
              action={report.nextBestAction}
              onTakeAction={(targetRoute) => {
                if (targetRoute === 'voice-practice' && onNavigateToVoice) {
                  onNavigateToVoice();
                } else if (targetRoute === 'prepare-me' && onNavigateToPrepare) {
                  onNavigateToPrepare();
                } else {
                  onNavigateToJudge();
                }
              }}
            />
          )}

          {/* 5 Core Assessment Categories Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Core Defense Pillars (Click to Inspect Evidence)
              </span>
              <span className="text-xs font-mono text-zinc-500">
                0-5 Explicit Scoring Rubric
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onSelect={() => handleSelectCategory(cat)}
                />
              ))}
            </div>
          </div>

          {/* Multi-Session Comparison (if >= 2 sessions) */}
          {report.comparison && (
            <SessionComparisonCard comparison={report.comparison} />
          )}

          {/* Strengths, Weaknesses, and Actionable Recommendations */}
          <PracticeRecommendationsView
            strengths={report.strengths}
            weaknesses={report.weaknesses}
            recommendations={report.recommendedPractice}
            onPracticeCategory={() => onNavigateToJudge()}
          />
        </div>
      )}

      {/* Category Detail Modal */}
      <CategoryDetailModal
        category={selectedCategory}
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onLaunchPractice={onNavigateToJudge}
      />

      {/* Assessment History Modal */}
      <ReadinessHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        reports={allReports}
        currentReportId={report?.id || null}
        onSelectReport={handleSelectHistoricalReport}
        onDeleteReport={handleDeleteReport}
      />
    </div>
  );
};
