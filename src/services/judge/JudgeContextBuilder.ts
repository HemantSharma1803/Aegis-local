import { ProjectContext } from '../../types/knowledge';
import { JudgeConfig, QuestionAttempt } from '../../types/judge';
import { PreparationPlan } from '../../types/prepare';
import { projectKnowledgeRepository } from '../knowledge/ProjectKnowledgeRepository';
import { preparationPlanRepository } from '../prepare/PreparationPlanRepository';

export interface JudgeQuestionRequest {
  projectId: string;
  projectName: string;
  config: JudgeConfig;
  previousAttempts: {
    question: string;
    category: string;
    difficulty: string;
    answer?: string;
    skipped?: boolean;
    overallAssessment?: string;
    gaps?: string[];
  }[];
  context: {
    systemContextPrompt: string;
    preparationInsights?: {
      weakAreas: string[];
      tradeoffs: string[];
      likelyQuestions: string[];
    };
    sourceFiles: string[];
  };
}

export interface JudgeEvaluationRequest {
  projectId: string;
  projectName: string;
  question: {
    category: string;
    difficulty: string;
    question: string;
    whyAsked: string;
  };
  answer: string;
  config: JudgeConfig;
  context: {
    systemContextPrompt: string;
    sourceFiles: string[];
  };
}

export interface JudgeSummarizeRequest {
  projectId: string;
  projectName: string;
  config: JudgeConfig;
  attempts: {
    question: string;
    category: string;
    difficulty: string;
    answer?: string;
    skipped?: boolean;
    evaluation?: {
      overallAssessment: string;
      strengths: string[];
      gaps: string[];
      corrections: string[];
      evidence: string[];
      suggestedImprovement: string;
    };
  }[];
  context: {
    systemContextPrompt: string;
  };
}

export class JudgeContextBuilder {
  static buildBaseContextPrompt(
    projectId: string,
    projectName: string,
    context: ProjectContext
  ): { systemContextPrompt: string; sourceFiles: string[] } {
    const extractedDocs = projectKnowledgeRepository.getExtractedDocumentsByProjectId(projectId);
    const sourceFiles: string[] = context.sources.map((s) => s.fileName);

    const contextLines: string[] = [];
    contextLines.push(`PROJECT NAME: "${projectName}"`);
    if (context.overview) {
      contextLines.push(`OVERVIEW: ${context.overview}`);
    }
    if (context.problem) {
      contextLines.push(`PROBLEM STATEMENT: ${context.problem}`);
    }
    if (context.solution) {
      contextLines.push(`SOLUTION ARCHITECTURE: ${context.solution}`);
    }
    if (context.technologies && context.technologies.length > 0) {
      contextLines.push(`TECHNOLOGIES: ${context.technologies.join(', ')}`);
    }
    if (context.frameworks && context.frameworks.length > 0) {
      contextLines.push(`FRAMEWORKS & LIBRARIES: ${context.frameworks.join(', ')}`);
    }
    if (context.languages && context.languages.length > 0) {
      contextLines.push(`LANGUAGES: ${context.languages.join(', ')}`);
    }
    if (context.architecture && context.architecture.length > 0) {
      contextLines.push(`ARCHITECTURAL SPECIFICATION:\n- ${context.architecture.join('\n- ')}`);
    }
    if (context.security && context.security.length > 0) {
      contextLines.push(`SECURITY & PRIVACY PRIMITIVES:\n- ${context.security.join('\n- ')}`);
    }
    if (context.potentialTopics && context.potentialTopics.length > 0) {
      contextLines.push(`KNOWN CHALLENGES & TOPICS:\n- ${context.potentialTopics.join('\n- ')}`);
    }

    // Add relevant snippets from extracted documents
    if (extractedDocs.length > 0) {
      contextLines.push('\n--- EVIDENCE EXTRACTS FROM PROJECT DOCUMENTS ---');
      for (const doc of extractedDocs) {
        const title = doc.title || 'Document';
        const clean = doc.text.trim();
        if (!clean) continue;
        const paragraphs = clean.split('\n\n').map((p) => p.trim()).filter(Boolean);
        const snippet = paragraphs.slice(0, 3).join('\n\n');
        contextLines.push(`[File: ${title}]\n${snippet.slice(0, 1500)}`);
      }
    }

    return {
      systemContextPrompt: contextLines.join('\n\n'),
      sourceFiles,
    };
  }

  static buildQuestionRequest(
    projectId: string,
    projectName: string,
    config: JudgeConfig,
    attempts: QuestionAttempt[],
    context: ProjectContext
  ): JudgeQuestionRequest {
    const { systemContextPrompt, sourceFiles } = this.buildBaseContextPrompt(
      projectId,
      projectName,
      context
    );

    // Retrieve preparation plan if available to seed high-value attack vectors
    const latestPlan = preparationPlanRepository.getLatestPlan(projectId);
    let preparationInsights: { weakAreas: string[]; tradeoffs: string[]; likelyQuestions: string[] } | undefined;
    if (latestPlan) {
      preparationInsights = {
        weakAreas: latestPlan.weakAreas.map((w) => `${w.area}: ${w.missingEvidence}`),
        tradeoffs: latestPlan.tradeoffs.map((t) => `${t.decision} vs ${t.alternativeLabel} (${t.potentialDownside})`),
        likelyQuestions: latestPlan.likelyQuestions.map((q) => q.question),
      };
    }

    const previousAttempts = attempts.map((a) => ({
      question: a.question.question,
      category: a.question.category,
      difficulty: a.question.difficulty,
      answer: a.answer,
      skipped: a.skipped,
      overallAssessment: a.evaluation?.overallAssessment,
      gaps: a.evaluation?.gaps,
    }));

    return {
      projectId,
      projectName,
      config,
      previousAttempts,
      context: {
        systemContextPrompt,
        preparationInsights,
        sourceFiles,
      },
    };
  }

  static buildEvaluationRequest(
    projectId: string,
    projectName: string,
    question: QuestionAttempt['question'],
    answer: string,
    config: JudgeConfig,
    context: ProjectContext
  ): JudgeEvaluationRequest {
    const { systemContextPrompt, sourceFiles } = this.buildBaseContextPrompt(
      projectId,
      projectName,
      context
    );

    return {
      projectId,
      projectName,
      question: {
        category: question.category,
        difficulty: question.difficulty,
        question: question.question,
        whyAsked: question.whyAsked,
      },
      answer,
      config,
      context: {
        systemContextPrompt,
        sourceFiles,
      },
    };
  }

  static buildSummarizeRequest(
    projectId: string,
    projectName: string,
    config: JudgeConfig,
    attempts: QuestionAttempt[],
    context: ProjectContext
  ): JudgeSummarizeRequest {
    const { systemContextPrompt } = this.buildBaseContextPrompt(projectId, projectName, context);

    const formattedAttempts = attempts.map((a) => ({
      question: a.question.question,
      category: a.question.category,
      difficulty: a.question.difficulty,
      answer: a.answer,
      skipped: a.skipped,
      evaluation: a.evaluation
        ? {
            overallAssessment: a.evaluation.overallAssessment,
            strengths: a.evaluation.strengths,
            gaps: a.evaluation.gaps,
            corrections: a.evaluation.corrections,
            evidence: a.evaluation.evidence,
            suggestedImprovement: a.evaluation.suggestedImprovement,
          }
        : undefined,
    }));

    return {
      projectId,
      projectName,
      config,
      attempts: formattedAttempts,
      context: {
        systemContextPrompt,
      },
    };
  }
}
