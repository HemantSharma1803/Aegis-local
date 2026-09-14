import { JudgeConfig, JudgeQuestion, AnswerEvaluation, QuestionAttempt, JudgeSessionSummary, ReadinessEvidence } from '../../types/judge';
import { ProjectContext } from '../../types/knowledge';
import { aiProviderRouter } from '../ai/AIProviderRouter';
import { JudgeContextBuilder } from './JudgeContextBuilder';

export class JudgeSimulationService {
  async getNextQuestion(
    projectId: string,
    projectName: string,
    config: JudgeConfig,
    attempts: QuestionAttempt[],
    context: ProjectContext
  ): Promise<JudgeQuestion> {
    const reqPayload = JudgeContextBuilder.buildQuestionRequest(
      projectId,
      projectName,
      config,
      attempts,
      context
    );

    return aiProviderRouter.generateJudgeQuestion(reqPayload);
  }

  async evaluateAnswer(
    projectId: string,
    projectName: string,
    question: JudgeQuestion,
    answer: string,
    config: JudgeConfig,
    context: ProjectContext
  ): Promise<AnswerEvaluation> {
    const reqPayload = JudgeContextBuilder.buildEvaluationRequest(
      projectId,
      projectName,
      question,
      answer,
      config,
      context
    );

    return aiProviderRouter.evaluateJudgeAnswer(reqPayload);
  }

  async summarizeSession(
    projectId: string,
    projectName: string,
    config: JudgeConfig,
    attempts: QuestionAttempt[],
    context: ProjectContext
  ): Promise<{ summary: JudgeSessionSummary; readinessEvidence: ReadinessEvidence }> {
    const reqPayload = JudgeContextBuilder.buildSummarizeRequest(
      projectId,
      projectName,
      config,
      attempts,
      context
    );

    return aiProviderRouter.summarizeJudgeSession(reqPayload);
  }

  private generateLocalQuestion(
    projectName: string,
    config: JudgeConfig,
    attempts: QuestionAttempt[],
    context: ProjectContext
  ): JudgeQuestion {
    const tech = context.technologies?.[0] || 'core stack';
    const arch = context.architecture?.[0] || 'local processing engine';
    const problem = context.problem || 'data privacy and reliability';
    const count = attempts.length;

    const questionTemplates = [
      {
        category: 'Architecture',
        difficulty: config.difficulty,
        question: `How does your architecture guarantee that user data stays strictly on-device when executing ${arch}?`,
        whyAsked: 'Judges test if architectural claims are backed by concrete structural boundaries.',
        sourceReferences: context.sources.map((s) => s.fileName).slice(0, 2),
      },
      {
        category: 'Trade-offs',
        difficulty: config.difficulty,
        question: `You opted for ${tech} over heavier cloud alternatives. What specific performance or resource limitations does this impose?`,
        whyAsked: 'Judges want to see if the engineering team understands the trade-offs of their core decisions.',
        sourceReferences: context.sources.map((s) => s.fileName).slice(0, 2),
      },
      {
        category: 'Security',
        difficulty: config.difficulty,
        question: `Walk me through your threat model. What prevents unauthorized extraction or memory tampering in ${projectName}?`,
        whyAsked: 'Assesses whether security guarantees are verified or purely theoretical.',
        sourceReferences: context.sources.map((s) => s.fileName).slice(0, 2),
      },
      {
        category: 'Problem & Solution',
        difficulty: config.difficulty,
        question: `Why is existing software failing to solve ${problem}, and how does your implementation prove superiority?`,
        whyAsked: 'Tests if the team can defend the necessity and value proposition of their implementation.',
        sourceReferences: context.sources.map((s) => s.fileName).slice(0, 2),
      },
      {
        category: 'Failure Modes',
        difficulty: config.difficulty,
        question: `What happens when the local system encounters malformed data or resource starvation during execution?`,
        whyAsked: 'Judges probe resilience and defensive programming practices.',
        sourceReferences: context.sources.map((s) => s.fileName).slice(0, 2),
      },
    ];

    const selected = questionTemplates[count % questionTemplates.length];
    return {
      id: `jq-local-${Date.now()}-${count}`,
      ...selected,
    };
  }

  private evaluateLocalAnswer(
    question: JudgeQuestion,
    answer: string,
    config: JudgeConfig,
    context: ProjectContext
  ): AnswerEvaluation {
    const trimmed = answer.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const mentionsTech = (context.technologies || []).some((t) =>
      trimmed.toLowerCase().includes(t.toLowerCase())
    );

    const strengths: string[] = [];
    const gaps: string[] = [];

    if (wordCount >= 30) {
      strengths.push('Provided a structured, multi-point technical rationale.');
    } else {
      gaps.push('Answer was relatively terse; judges expect deeper elaboration on implementation details.');
    }

    if (mentionsTech) {
      strengths.push('Directly anchored response to verified project technologies.');
    } else {
      gaps.push('Did not reference specific project components or implementation files.');
    }

    return {
      overallAssessment:
        wordCount >= 25
          ? 'Solid foundational defense addressing the core question with sound engineering reasoning.'
          : 'Answer is concise but lacks critical technical depth and concrete mitigation details.',
      strengths: strengths.length > 0 ? strengths : ['Addressed the main question topic.'],
      gaps: gaps.length > 0 ? gaps : ['Could provide specific telemetry or constraint parameters.'],
      corrections: [],
      evidence: context.sources.map((s) => `Referenced file: ${s.fileName}`).slice(0, 2),
      suggestedImprovement:
        'When presenting this live, begin with the architectural constraint, name the specific component responsible, and conclude with the trade-off.',
      nextDifficultyRecommendation: wordCount >= 30 ? 'challenging' : 'technical',
    };
  }

  private generateLocalSummary(
    config: JudgeConfig,
    attempts: QuestionAttempt[],
    context: ProjectContext
  ): { summary: JudgeSessionSummary; readinessEvidence: ReadinessEvidence } {
    const attemptedCount = attempts.filter((a) => !a.skipped && a.answer).length;
    const skippedCount = attempts.filter((a) => a.skipped).length;

    const allStrengths = attempts.flatMap((a) => a.evaluation?.strengths || []).slice(0, 3);
    const allGaps = attempts.flatMap((a) => a.evaluation?.gaps || []).slice(0, 3);

    return {
      summary: {
        questionsAttempted: attemptedCount,
        questionsSkipped: skippedCount,
        majorStrengths:
          allStrengths.length > 0
            ? allStrengths
            : ['Demonstrated solid grasp of project purpose and architecture.'],
        majorGaps:
          allGaps.length > 0
            ? allGaps
            : ['Need deeper rehearsal on security edge cases and trade-off defense.'],
        topicsRequiringPractice: [
          'Failure recovery mechanics',
          'Component boundary trade-offs',
        ],
        recommendedNextStep:
          'Review the Weak Areas in Prepare Me and run an additional 10-minute Challenging simulation.',
      },
      readinessEvidence: {
        projectUnderstanding: 'Demonstrated coherent understanding of project goals and structure.',
        problemSolutionClarity: 'Clearly articulated why the project exists and what problem it addresses.',
        technicalDefense: 'Successfully stood up to technical questioning with substantive arguments.',
        architectureExplanation: 'Explained core components and data flow boundaries.',
        questionHandling: 'Engaged constructively with skeptical questions under timer constraints.',
        communicationClarity: 'Responses were concise, direct, and technically focused.',
        identifiedGaps: allGaps.length > 0 ? allGaps : ['More precision needed on benchmark claims.'],
      },
    };
  }
}

export const judgeSimulationService = new JudgeSimulationService();
