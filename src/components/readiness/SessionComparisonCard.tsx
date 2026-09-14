import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ReadinessSessionComparison } from '../../types/readiness';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface SessionComparisonCardProps {
  comparison: ReadinessSessionComparison;
}

export const SessionComparisonCard: React.FC<SessionComparisonCardProps> = ({ comparison }) => {
  if (!comparison || comparison.categoryChanges.length === 0) return null;

  const getTrendIcon = (trend: 'improved' | 'steady' | 'regressed') => {
    switch (trend) {
      case 'improved':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case 'regressed':
        return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getTrendBadge = (trend: 'improved' | 'steady' | 'regressed') => {
    switch (trend) {
      case 'improved':
        return (
          <Badge variant="success" size="sm">
            IMPROVED
          </Badge>
        );
      case 'regressed':
        return (
          <Badge variant="error" size="sm">
            ELEVATED SCRUTINY
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" size="sm">
            CONSISTENT
          </Badge>
        );
    }
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-sky-400" />
            <CardTitle>Session Progress Comparison</CardTitle>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Comparing {comparison.earlierDate} <ArrowRight className="inline w-3 h-3 mx-1 text-zinc-500" />{' '}
            {comparison.latestDate}
          </div>
        </div>
        <CardDescription>
          {comparison.overallComparisonSummary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="divide-y divide-zinc-800/80">
          {comparison.categoryChanges.map((change) => (
            <div key={change.categoryId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{change.categoryName}</span>
                  {getTrendBadge(change.trend)}
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  {change.explanation}
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono shrink-0 text-zinc-400">
                <span className="text-zinc-400 uppercase text-[11px]">
                  {change.previousLevel} ({change.previousScore}/5)
                </span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
                <span className="text-zinc-100 font-semibold uppercase text-[11px]">
                  {change.currentLevel} ({change.currentScore}/5)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
