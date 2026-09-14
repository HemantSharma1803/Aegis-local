import React from 'react';
import {
  FileText,
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { ProjectKnowledge, ProjectContext } from '../../types/knowledge';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface KnowledgeOverviewProps {
  context: ProjectContext;
  knowledge: ProjectKnowledge | null;
  onRefreshKnowledge: () => void;
  isProcessing?: boolean;
}

export const KnowledgeOverview: React.FC<KnowledgeOverviewProps> = ({
  context,
  knowledge,
  onRefreshKnowledge,
  isProcessing = false,
}) => {
  if (!context.hasExtractedKnowledge && (!knowledge || knowledge.sourceFiles.length === 0)) {
    return null;
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Knowledge Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wide font-mono">
                Project Knowledge Base
              </span>
              <Badge variant="success" size="sm" dot>
                {isProcessing ? 'Building context...' : 'Ready'}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Derived from {context.sources.length} document source(s) · {knowledge?.totalWordCount.toLocaleString() || 0} words indexed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshKnowledge}
            disabled={isProcessing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />}
          >
            {isProcessing ? 'Building...' : 'Rebuild Context'}
          </Button>
        </div>
      </div>

      {/* 1. PROJECT CONTEXT: Overview, Problem, Solution */}
      {(context.overview || context.problem || context.solution) && (
        <section className="space-y-3">
          <h3 className="text-xs font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Project Context</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {context.problem && (
              <Card variant="subtle" className="p-4 space-y-2">
                <span className="text-[11px] font-mono uppercase font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Problem Statement
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  &quot;{context.problem}&quot;
                </p>
              </Card>
            )}

            {context.solution && (
              <Card variant="subtle" className="p-4 space-y-2">
                <span className="text-[11px] font-mono uppercase font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Proposed Solution
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  &quot;{context.solution}&quot;
                </p>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* 2. TECHNICAL PROFILE: Technologies, Frameworks, Languages */}
      {(context.technologies.length > 0 ||
        context.frameworks.length > 0 ||
        context.languages.length > 0) && (
        <section className="space-y-3">
          <h3 className="text-xs font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Technical Profile</span>
          </h3>

          <Card variant="default" className="p-5 space-y-4">
            {context.technologies.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-zinc-400 block">
                  Identified Technologies & Stacks
                </span>
                <div className="flex flex-wrap gap-2">
                  {context.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {context.security.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/70">
                <span className="text-[11px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Security Primitives & Concepts
                </span>
                <div className="flex flex-wrap gap-2">
                  {context.security.map((sec, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono text-emerald-300"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* 3. ARCHITECTURE CONCEPTS */}
      {context.architecture.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Architecture & Principles</span>
          </h3>

          <Card variant="default" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {context.architecture.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300"
                >
                  <span className="font-mono text-[10px] text-zinc-500 font-semibold mt-0.5">
                    #{idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* 4. SOURCES: Contributing Files with Traceability */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Source Traceability ({context.sources.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            Updated {formatDate(context.lastUpdated)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {context.sources.map((src, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
            >
              <div className="truncate">
                <span className="font-medium text-zinc-200 block truncate">
                  {src.fileName}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {src.wordCount.toLocaleString()} words indexed
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 flex-shrink-0">
                Extracted
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
