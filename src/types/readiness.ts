import { AIProcessingMode } from './ai';

export type ReadinessLevel = 'not-evaluated' | 'developing' | 'competent' | 'strong';

export type OverallReadinessLevel =
  | 'not-evaluated'
  | 'early-preparation'
  | 'building-confidence'
  | 'presentation-ready'
  | 'strong-defense';

export interface ReadinessEvidenceItem {
  id: string;
  sourceType: 'judge-session' | 'prepare-me' | 'project-file' | 'voice-practice';
  sourceId: string;
  sourceDate: string;
  category: string;
  questionText?: string;
  answerSnippet?: string;
  evaluationSnippet?: string;
  strengthOrGap: 'strength' | 'gap' | 'neutral';
  description: string;
}

export interface CategoryAssessment {
  id: string;
  name: string;
  description: string;
  level: ReadinessLevel;
  score: number; // 0 to 5 rubric
  evidenceCount: number;
  evidence: ReadinessEvidenceItem[];
  strengths: string[];
  gaps: string[];
  explanation: string;
  recommendation: string;
}

export interface ReadinessPracticeRecommendation {
  id: string;
  area: string;
  whyItMatters: string;
  whatToPractice: string;
  priority: 'high' | 'medium' | 'low';
  relatedCategory: string;
}

export interface NextBestAction {
  title: string;
  explanation: string;
  actionCategory: string;
  targetRoute?: 'judge-mode' | 'prepare-me' | 'voice-practice';
}

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  previousLevel: ReadinessLevel;
  currentLevel: ReadinessLevel;
  previousScore: number;
  currentScore: number;
  trend: 'improved' | 'steady' | 'regressed';
  explanation: string;
}

export interface ReadinessSessionComparison {
  earlierSessionId: string;
  earlierDate: string;
  latestSessionId: string;
  latestDate: string;
  categoryChanges: CategoryProgress[];
  overallComparisonSummary: string;
}

export interface ReadinessReport {
  id: string;
  projectId: string;
  generatedAt: string;
  overallLevel: OverallReadinessLevel;
  overallScore: number; // 0 to 5 rubric
  overallExplanation: string;
  categories: CategoryAssessment[];
  strengths: string[];
  weaknesses: string[]; // Areas to Strengthen
  recommendedPractice: ReadinessPracticeRecommendation[];
  nextBestAction: NextBestAction;
  evidence: ReadinessEvidenceItem[];
  sessionsUsed: string[];
  comparison?: ReadinessSessionComparison;
  providerName: string;
  processingMode: AIProcessingMode;
}
