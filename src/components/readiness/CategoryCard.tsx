import React from 'react';
import {
  BookOpen,
  Lightbulb,
  ShieldCheck,
  FolderGit2,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CategoryAssessment } from '../../types/readiness';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface CategoryCardProps {
  category: CategoryAssessment;
  onSelect: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onSelect }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'understanding':
        return <BookOpen className="w-4 h-4 text-sky-400" />;
      case 'clarity':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'defense':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'architecture':
        return <FolderGit2 className="w-4 h-4 text-purple-400" />;
      case 'questions':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'strong':
        return 'success';
      case 'competent':
        return 'warning';
      case 'developing':
        return 'error';
      default:
        return 'outline';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'strong':
        return 'STRONG';
      case 'competent':
        return 'READY';
      case 'developing':
        return 'DEVELOPING';
      default:
        return 'NOT EVALUATED';
    }
  };

  // 5-segment rubric bar (0 to 5)
  const renderRubricBars = () => {
    const activeCount = Math.round(category.score);
    return (
      <div className="flex items-center gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((step) => {
          const isFilled = step <= activeCount;
          return (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-xs transition-all ${
                isFilled
                  ? category.score >= 4
                    ? 'bg-emerald-400'
                    : category.score >= 3
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                  : 'bg-zinc-800'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card
      variant="default"
      className="p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all cursor-pointer group select-none"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`View details for ${category.name}`}
    >
      <div className="space-y-3">
        {/* Top bar: Icon & Level */}
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center">
            {getIcon(category.id)}
          </div>
          <Badge variant={getBadgeVariant(category.level)} size="sm">
            {getLevelLabel(category.level)}
          </Badge>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1 line-clamp-2">
            {category.explanation || category.description}
          </p>
        </div>

        {/* Rubric Score indicator */}
        {category.level !== 'not-evaluated' ? (
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Rubric Score</span>
              <span className="text-zinc-200 font-semibold">{category.score} / 5.0</span>
            </div>
            {renderRubricBars()}
          </div>
        ) : (
          <div className="pt-2">
            <div className="h-1.5 w-full bg-zinc-800 rounded-xs" />
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-mono text-zinc-500">
          {category.evidenceCount > 0
            ? `${category.evidenceCount} verified probe${category.evidenceCount > 1 ? 's' : ''}`
            : 'No evidence recorded'}
        </span>
        <div className="flex items-center gap-1 text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
          <span>Inspect</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Card>
  );
};
