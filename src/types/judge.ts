export type JudgeDifficulty = 'easy' | 'technical' | 'challenging';

export type JudgeFocus =
  | 'project'
  | 'problem-solution'
  | 'architecture'
  | 'technology'
  | 'security'
  | 'aiml'
  | 'trade-offs'
  | 'mixed';

export type JudgeSessionLength = '5' | '10' | '15';

export type QuestionStyle = 'direct' | 'cross-examination' | 'mixed';

export interface JudgeConfig {
  difficulty: JudgeDifficulty;
  focus: JudgeFocus;
  sessionLength: JudgeSessionLength;
  questionStyle: QuestionStyle;
}

export interface JudgeQuestion {
  id: string;
  category: string;
  difficulty: JudgeDifficulty;
  question: string;
  whyAsked: string;
  sourceReferences?: string[];
}

export interface AnswerEvaluation {
  overallAssessment: string;
  strengths: string[];
  gaps: string[];
  corrections: string[];
  evidence: string[];
  suggestedImprovement: string;
  nextDifficultyRecommendation?: JudgeDifficulty;
}

export interface QuestionAttempt {
  id: string;
  question: JudgeQuestion;
  askedAt: string;
  answeredAt?: string;
  answer?: string;
  skipped?: boolean;
  evaluation?: AnswerEvaluation;
  evaluationError?: string;
}

export interface ReadinessEvidence {
  projectUnderstanding: string;
  problemSolutionClarity: string;
  technicalDefense: string;
  architectureExplanation: string;
  questionHandling: string;
  communicationClarity: string;
  identifiedGaps: string[];
}

export interface JudgeSessionSummary {
  questionsAttempted: number;
  questionsSkipped: number;
  majorStrengths: string[];
  majorGaps: string[];
  topicsRequiringPractice: string[];
  recommendedNextStep: string;
}

export interface JudgeSession {
  id: string;
  projectId: string;
  startedAt: string;
  endedAt?: string;
  config: JudgeConfig;
  attempts: QuestionAttempt[];
  currentAttemptIndex: number;
  status: 'active' | 'completed' | 'abandoned';
  summary?: JudgeSessionSummary;
  readinessEvidence?: ReadinessEvidence;
}
