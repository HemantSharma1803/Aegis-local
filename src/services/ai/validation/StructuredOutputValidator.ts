import { PreparationPlan } from '../../../types/prepare';
import { JudgeQuestion, AnswerEvaluation, JudgeSessionSummary } from '../../../types/judge';
import { VoicePracticeResult } from '../../../types/voice';
import { ReadinessReport } from '../../../types/readiness';

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

export class StructuredOutputValidator {
  /**
   * Validate and sanitize PreparationPlan structured AI response
   */
  static validatePreparationPlan(input: any): ValidationResult<PreparationPlan> {
    const errors: string[] = [];
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Output must be a valid non-empty JSON object'] };
    }

    if (!input.projectSummary || typeof input.projectSummary !== 'object') {
      errors.push('Missing or invalid projectSummary object');
    }
    if (!input.pitch60s || typeof input.pitch60s !== 'object' || !input.pitch60s.pitch) {
      errors.push('Missing or invalid pitch60s narrative');
    }
    if (!Array.isArray(input.presentationStory)) {
      errors.push('presentationStory must be an array');
    }
    if (!Array.isArray(input.technicalDefense)) {
      errors.push('technicalDefense must be an array');
    }
    if (!Array.isArray(input.checklist)) {
      errors.push('checklist must be an array');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Safe normalized fallback assignment
    const plan: PreparationPlan = {
      id: input.id || `plan-${Date.now()}`,
      projectId: input.projectId || 'unknown',
      createdAt: input.createdAt || new Date().toISOString(),
      preferences: input.preferences || {
        goal: 'Competition',
        difficulty: 'Technical',
        focusAreas: ['Architecture'],
        sessionPreference: 'Standard',
      },
      projectSummary: {
        whatItIs: input.projectSummary?.whatItIs || 'Technical Project',
        problemItSolves: input.projectSummary?.problemItSolves || 'Identified problem space',
        howItWorks: input.projectSummary?.howItWorks || 'Architectural pipeline',
        whyItMatters: input.projectSummary?.whyItMatters || 'Engineering relevance',
        sources: Array.isArray(input.projectSummary?.sources) ? input.projectSummary.sources : [],
      },
      pitch60s: {
        title: input.pitch60s?.title || '60-Second Pitch',
        pitch: input.pitch60s?.pitch || 'Pitch not generated.',
        estimatedSeconds: Number(input.pitch60s?.estimatedSeconds) || 60,
      },
      presentationStory: Array.isArray(input.presentationStory) ? input.presentationStory : [],
      keyPoints: Array.isArray(input.keyPoints) ? input.keyPoints : [],
      technicalDefense: Array.isArray(input.technicalDefense) ? input.technicalDefense : [],
      difficultQuestions: Array.isArray(input.difficultQuestions) ? input.difficultQuestions : [],
      weakAreas: Array.isArray(input.weakAreas) ? input.weakAreas : [],
      tradeoffs: Array.isArray(input.tradeoffs) ? input.tradeoffs : [],
      likelyQuestions: Array.isArray(input.likelyQuestions) ? input.likelyQuestions : [],
      checklist: Array.isArray(input.checklist) ? input.checklist : [],
      recommendedPractice: Array.isArray(input.recommendedPractice) ? input.recommendedPractice : [],
      sourceAttributions: Array.isArray(input.sourceAttributions) ? input.sourceAttributions : [],
      providerName: input.providerName || 'Local AI Architecture',
    };

    return { valid: true, errors: [], data: plan };
  }

  /**
   * Validate and sanitize adaptive JudgeQuestion structured AI response
   */
  static validateJudgeQuestion(input: any): ValidationResult<JudgeQuestion> {
    const errors: string[] = [];
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Output must be a valid JSON object'] };
    }

    if (!input.question || typeof input.question !== 'string' || !input.question.trim()) {
      errors.push('Missing or empty question text string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const question: JudgeQuestion = {
      id: input.id || `jq-${Date.now()}`,
      category: input.category || 'Architecture',
      difficulty: input.difficulty === 'easy' || input.difficulty === 'challenging' ? input.difficulty : 'technical',
      question: input.question.trim(),
      whyAsked: input.whyAsked || 'To evaluate technical defensibility and architectural reasoning.',
      sourceReferences: Array.isArray(input.sourceReferences) ? input.sourceReferences : [],
    };

    return { valid: true, errors: [], data: question };
  }

  /**
   * Validate and sanitize AnswerEvaluation structured AI response
   */
  static validateAnswerEvaluation(input: any): ValidationResult<AnswerEvaluation> {
    const errors: string[] = [];
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Output must be a valid JSON object'] };
    }

    if (!input.overallAssessment || typeof input.overallAssessment !== 'string') {
      errors.push('Missing or empty overallAssessment string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const evaluation: AnswerEvaluation = {
      overallAssessment: input.overallAssessment.trim(),
      strengths: Array.isArray(input.strengths) ? input.strengths : [],
      gaps: Array.isArray(input.gaps) ? input.gaps : [],
      corrections: Array.isArray(input.corrections) ? input.corrections : [],
      evidence: Array.isArray(input.evidence) ? input.evidence : [],
      suggestedImprovement: input.suggestedImprovement || 'Articulate specific constraints and trade-offs.',
      nextDifficultyRecommendation:
        input.nextDifficultyRecommendation === 'easy' || input.nextDifficultyRecommendation === 'challenging'
          ? input.nextDifficultyRecommendation
          : 'technical',
    };

    return { valid: true, errors: [], data: evaluation };
  }

  /**
   * Validate and sanitize JudgeSessionSummary structured AI response
   */
  static validateJudgeSummary(input: any): ValidationResult<JudgeSessionSummary> {
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Invalid summary output object'] };
    }

    const summary: JudgeSessionSummary = {
      questionsAttempted: Number(input.questionsAttempted) || 0,
      questionsSkipped: Number(input.questionsSkipped) || 0,
      majorStrengths: Array.isArray(input.majorStrengths) ? input.majorStrengths : [],
      majorGaps: Array.isArray(input.majorGaps) ? input.majorGaps : [],
      topicsRequiringPractice: Array.isArray(input.topicsRequiringPractice) ? input.topicsRequiringPractice : [],
      recommendedNextStep: input.recommendedNextStep || 'Review weak areas in Prepare Me and run targeted drills.',
    };

    return { valid: true, errors: [], data: summary };
  }

  /**
   * Validate and sanitize VoicePracticeResult structured AI response
   */
  static validateVoicePracticeResult(input: any): ValidationResult<VoicePracticeResult> {
    const errors: string[] = [];
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Invalid voice practice analysis object'] };
    }

    if (!input.summary || typeof input.summary !== 'string') {
      errors.push('Missing summary evaluation string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const clamp = (val: any, min = 1, max = 5, fallback = 3.5): number => {
      const num = Number(val);
      if (isNaN(num)) return fallback;
      return Math.max(min, Math.min(max, Math.round(num * 10) / 10));
    };

    const result: VoicePracticeResult = {
      mode: input.mode || 'pitch-60s',
      transcript: input.transcript || '',
      summary: input.summary,
      strengths: Array.isArray(input.strengths) ? input.strengths : [],
      improvements: Array.isArray(input.improvements) ? input.improvements : [],
      missingPoints: Array.isArray(input.missingPoints) ? input.missingPoints : [],
      projectEvidence: Array.isArray(input.projectEvidence) ? input.projectEvidence : [],
      recommendedPractice: Array.isArray(input.recommendedPractice) ? input.recommendedPractice : [],
      accuracyScore: clamp(input.accuracyScore),
      clarityScore: clamp(input.clarityScore),
      defenseScore: clamp(input.defenseScore),
      overallRubricScore: clamp(input.overallRubricScore),
      primaryCategory: input.primaryCategory || 'defense',
    };

    return { valid: true, errors: [], data: result };
  }

  /**
   * Validate and sanitize ReadinessReport AI synthesis
   */
  static validateReadinessReport(input: any): ValidationResult<Partial<ReadinessReport>> {
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Invalid readiness report synthesis object'] };
    }

    const report: Partial<ReadinessReport> = {
      overallExplanation: input.overallExplanation || 'Readiness synthesized from session evaluation ledger.',
      strengths: Array.isArray(input.strengths) ? input.strengths : [],
      weaknesses: Array.isArray(input.weaknesses) ? input.weaknesses : [],
      recommendedPractice: Array.isArray(input.recommendedPractice) ? input.recommendedPractice : [],
      nextBestAction: input.nextBestAction || undefined,
    };

    return { valid: true, errors: [], data: report };
  }
}
