import React from 'react';
import { motion } from 'motion/react';
import {
  FolderPlus,
  FolderOpen,
  ArrowRight,
  Shield,
  FileCode,
  Sparkles,
  Gavel,
  Compass,
  CheckCircle2,
  Mic,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useProject } from '../context/ProjectContext';
import { NavPage } from '../types';

interface HomePageProps {
  onNavigate: (page: NavPage) => void;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenCreateModal,
  onOpenImportModal,
}) => {
  const { activeProject, hasProject, loadDemoProject } = useProject();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      {/* Hero Section */}
      <section className="space-y-6 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              AEGIS LOCAL
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Private AI Presentation Coach
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100 max-w-2xl leading-tight">
            Prepare with the work you already created.
          </h1>

          <p className="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Turn your project files into a private preparation workspace for
            questions, practice and presentation readiness.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenCreateModal}
            icon={<FolderPlus className="w-4 h-4" />}
          >
            Create Project
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={loadDemoProject}
            icon={<FolderOpen className="w-4 h-4" />}
          >
            Open Demo Project
          </Button>
        </div>
      </section>

      {/* "Your workspace" Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-zinc-200 uppercase font-mono tracking-wider">
              Your workspace
            </h2>
            {hasProject && (
              <Badge variant="success" size="sm" dot>
                Active
              </Badge>
            )}
          </div>

          {hasProject && (
            <button
              onClick={() => onNavigate('project')}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {!hasProject ? (
          /* Clean empty state for new user - No fake statistics */
          <EmptyState
            badgeText="LOCAL SANDBOX EMPTY"
            icon={<Lock className="w-6 h-6 text-zinc-400" />}
            title="No project loaded yet"
            description="Start by creating a new local project or open the included Aegis Journal demo to explore the preparation workspace."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenCreateModal}
                icon={<FolderPlus className="w-3.5 h-3.5" />}
              >
                Create Project
              </Button>
            }
            secondaryAction={
              <Button
                variant="outline"
                size="sm"
                onClick={loadDemoProject}
                icon={<FolderOpen className="w-3.5 h-3.5" />}
              >
                Open Demo Project
              </Button>
            }
          />
        ) : (
          /* Real active project workspace card with explicit required actions */
          <div className="space-y-4">
            <Card variant="default" className="border-zinc-800 bg-zinc-900/70 p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
                      {activeProject?.name || activeProject?.title}
                    </h3>
                    {activeProject?.isDemo && (
                      <Badge variant="info" size="sm">
                        Demo Project
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs font-mono text-emerald-400 font-medium">
                    {activeProject?.category || activeProject?.tagline || 'Local Project Workspace'}
                  </p>

                  <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                    {activeProject?.description || 'No description provided.'}
                  </p>

                  {activeProject?.goal && (
                    <div className="pt-2 text-xs flex items-baseline gap-1.5">
                      <span className="font-mono text-zinc-400 font-semibold text-[11px] uppercase">Goal:</span>
                      <span className="text-zinc-300 italic">{activeProject.goal}</span>
                    </div>
                  )}
                </div>

                {/* Explicit Action Buttons required in Segment 2: Open Project, Prepare Me, Judge Mode */}
                <div className="flex flex-wrap md:flex-col gap-2.5 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('project')}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Open Project
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('prepare-me')}
                    icon={<Compass className="w-3.5 h-3.5" />}
                  >
                    Prepare Me
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('judge-mode')}
                    icon={<Gavel className="w-3.5 h-3.5" />}
                  >
                    Judge Mode
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('voice-practice')}
                    icon={<Mic className="w-3.5 h-3.5 text-cyan-400" />}
                  >
                    Voice Practice
                  </Button>
                </div>
              </div>

              {/* Quick Jump Grid into features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
                <div
                  onClick={() => onNavigate('project')}
                  className="p-3.5 rounded-lg bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="font-medium text-zinc-200 group-hover:text-white">
                      Project Files
                    </span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {activeProject?.files?.length || 0} file(s) in manifest
                  </p>
                </div>

                <div
                  onClick={() => onNavigate('prepare-me')}
                  className="p-3.5 rounded-lg bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="font-medium text-zinc-200 group-hover:text-white">
                      Presentation Plan
                    </span>
                    <Compass className="w-3 h-3 text-zinc-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Pitch structure & key concepts
                  </p>
                </div>

                <div
                  onClick={() => onNavigate('judge-mode')}
                  className="p-3.5 rounded-lg bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="font-medium text-zinc-200 group-hover:text-white">
                      Judge Mode
                    </span>
                    <Gavel className="w-3 h-3 text-zinc-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Simulate cross-examination
                  </p>
                </div>

                <div
                  onClick={() => onNavigate('voice-practice')}
                  className="p-3.5 rounded-lg bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="font-medium text-zinc-200 group-hover:text-white">
                      Voice Practice
                    </span>
                    <Mic className="w-3 h-3 text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Timed verbal pitch defense
                  </p>
                </div>

                <div
                  onClick={() => onNavigate('readiness')}
                  className="p-3.5 rounded-lg bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="font-medium text-zinc-200 group-hover:text-white">
                      Readiness Report
                    </span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Evidence-based rubric score
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* Product Architecture Pillars - Discreet, real tech design */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
          <div className="flex items-center gap-2 mb-2 text-zinc-300">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Local-First Privacy
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Project files and context stay in your local filesystem. Processing runs
            without non-consensual telemetry.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
          <div className="flex items-center gap-2 mb-2 text-zinc-300">
            <Gavel className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Judge Cross-Examination
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Stress-test your architectural decisions, trade-offs, and failure modes
            against simulated technical judges.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
          <div className="flex items-center gap-2 mb-2 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Presentation Readiness
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Objective evaluation of your technical defense, problem-solution clarity,
            and presentation pacing.
          </p>
        </div>
      </section>
    </div>
  );
};
