import { SourceReference } from './ai';

export type PreparationGoal =
  | 'Competition'
  | 'Project Demo'
  | 'Technical Interview'
  | 'Project Viva'
  | 'General Presentation';

export type PreparationDifficulty = 'Foundational' | 'Technical' | 'Challenging';

export type PreparationFocusArea =
  | 'Project Story'
  | 'Problem & Solution'
  | 'Architecture'
  | 'Technology Choices'
  | 'Security'
  | 'AI/ML'
  | 'Trade-offs'
  | 'Potential Questions';

export type SessionPreference = 'Quick' | 'Standard' | 'Deep';

export interface PreparationPreferences {
  goal: PreparationGoal;
  difficulty: PreparationDifficulty;
  focusAreas: PreparationFocusArea[];
  sessionPreference: SessionPreference;
}

export interface ProjectSummary {
  whatItIs: string;
  problemItSolves: string;
  howItWorks: string;
  whyItMatters: string;
  sources: SourceReference[];
}

export interface PresentationStorySection {
  title: string;
  narrative: string;
  needsProjectEvidence?: boolean;
}

export interface PresentationPitch {
  title: string;
  pitch: string;
  estimatedSeconds: number;
}

export interface KeyTalkingPoint {
  topic: string;
  category: 'Problem' | 'Solution' | 'Architecture' | 'Technology' | 'Security' | 'Innovation' | 'Trade-offs' | 'General';
  whyItMatters: string;
  supportingSource?: string;
}

export interface TechnicalDefenseItem {
  question: string;
  whyAsked: string;
  projectEvidence: string;
  suggestedAnswerStructure: string[];
  sourceFiles: string[];
}

export interface DifficultQuestionItem {
  question: string;
  area: string;
  vulnerabilityOrRisk: string;
  defenseRecommendation: string;
  sourceFiles?: string[];
}

export interface WeakAreaItem {
  area: string;
  whyItMatters: string;
  missingEvidence: string;
  recommendedPreparation: string;
}

export interface TechnicalTradeoffItem {
  decision: string;
  alternativeLabel: string;
  whyDecisionMade: string;
  potentialDownside: string;
  howToDefend: string;
}

export interface LikelyQuestionItem {
  question: string;
  category: 'Foundational' | 'Technical' | 'Architecture' | 'Security' | 'AI/ML' | 'Product' | 'Challenge-level';
  priority: 'High' | 'Medium' | 'Low';
  sourceReferences: string[];
}

export interface PracticeRecommendation {
  action: string;
  reason: string;
  tag: string;
}

export interface PreparationChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface PreparationPlan {
  id: string;
  projectId: string;
  createdAt: string;
  preferences: PreparationPreferences;
  projectSummary: ProjectSummary;
  pitch60s: PresentationPitch;
  presentationStory: PresentationStorySection[];
  keyPoints: KeyTalkingPoint[];
  technicalDefense: TechnicalDefenseItem[];
  difficultQuestions: DifficultQuestionItem[];
  weakAreas: WeakAreaItem[];
  tradeoffs: TechnicalTradeoffItem[];
  likelyQuestions: LikelyQuestionItem[];
  checklist: PreparationChecklistItem[];
  recommendedPractice: PracticeRecommendation[];
  sourceAttributions: SourceReference[];
  providerName: string;
}
