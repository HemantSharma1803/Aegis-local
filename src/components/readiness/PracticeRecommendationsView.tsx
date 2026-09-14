import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  ShieldAlert,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { ReadinessPracticeRecommendation } from '../../types/readiness';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PracticeRecommendationsViewProps {
  strengths: string[];
  weaknesses: string[];
  recommendations: ReadinessPracticeRecommendation[];
  onPracticeCategory?: (categoryId: string) => void;
}

export const PracticeRecommendationsView: React.FC<PracticeRecommendationsViewProps> = ({
  strengths,
  weaknesses,
  recommendations,
  onPracticeCategory,
}) => {
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <Badge variant="error" size="sm">HIGH PRIORITY</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">MEDIUM</Badge>;
      default:
        return <Badge variant="outline" size="sm">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demonstrated Strengths */}
        <Card variant="default">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono text-xs uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <CardTitle className="text-xs">Demonstrated Strengths</CardTitle>
            </div>
            <CardDescription>
              Technical competencies substantiated by verified practice answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              {strengths && strengths.length > 0 ? (
                strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500 italic">Complete a simulation to document verified strengths.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Areas to Strengthen */}
        <Card variant="default">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold font-mono text-xs uppercase">
              <AlertCircle className="w-4 h-4" />
              <CardTitle className="text-xs">Areas to Strengthen</CardTitle>
            </div>
            <CardDescription>
              Vulnerabilities and omissions exposed during simulated cross-examination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              {weaknesses && weaknesses.length > 0 ? (
                weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{w}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500 italic">No critical omissions recorded in completed simulations.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Practice Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-purple-400" />
                <CardTitle>Targeted Practice Drills</CardTitle>
              </div>
              <Badge variant="outline" size="sm">
                Evidence-Grounded
              </Badge>
            </div>
            <CardDescription>
              High-leverage exercises designed to remediate identified defense gaps
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col justify-between space-y-3 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200 text-sm">{rec.area}</span>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      <span className="text-zinc-300 font-medium">Why it matters:</span> {rec.whyItMatters}
                    </p>
                    <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold block mb-0.5">
                        What to Practice:
                      </span>
                      <span>{rec.whatToPractice}</span>
                    </div>
                  </div>

                  {onPracticeCategory && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onPracticeCategory(rec.relatedCategory)}
                        icon={<ArrowRight className="w-3 h-3" />}
                      >
                        Drill in Judge Mode
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
