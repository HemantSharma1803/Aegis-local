import { VoicePracticeMode, VoicePracticePrompt } from '../../types/voice';
import { ProjectContext } from '../../types/knowledge';
import { judgeSessionRepository } from '../judge/JudgeSessionRepository';
import { preparationPlanRepository } from '../prepare/PreparationPlanRepository';

export class VoicePromptGenerator {
  /**
   * Generates a curated list of practice prompts grounded in the active project's actual context.
   */
  static generatePrompts(
    projectId: string,
    projectName: string,
    projectContext?: ProjectContext
  ): Record<VoicePracticeMode, VoicePracticePrompt[]> {
    const techStack = projectContext?.technologies?.slice(0, 4).join(', ') || '';
    const hasSecurityTopic =
      (projectContext?.security && projectContext.security.length > 0) ||
      projectContext?.potentialTopics?.some(
        (t) =>
          t.toLowerCase().includes('security') ||
          t.toLowerCase().includes('privacy') ||
          t.toLowerCase().includes('encryption')
      );
    const hasArchTopic =
      (projectContext?.architecture && projectContext.architecture.length > 0) ||
      projectContext?.potentialTopics?.some(
        (t) =>
          t.toLowerCase().includes('architect') ||
          t.toLowerCase().includes('structure') ||
          t.toLowerCase().includes('pipeline')
      );

    // 1. 60-Second Pitch Prompts (max 60s)
    const pitchPrompts: VoicePracticePrompt[] = [
      {
        id: `prompt-pitch-core-${projectId}`,
        mode: 'pitch-60',
        category: 'pitch',
        title: '60-Second Competition Pitch',
        promptText: `Deliver a concise, high-impact 60-second verbal pitch for ${projectName}. Clearly state the problem, your technical solution, and why it matters.`,
        guidance: [
          'State the target problem in the first 15 seconds.',
          'Introduce your technical approach without excessive jargon.',
          'Close with your primary innovation or real-world advantage.',
          'Keep your delivery pacing steady under the 60-second limit.',
        ],
        maxDurationSeconds: 60,
      },
      {
        id: `prompt-pitch-problem-${projectId}`,
        mode: 'pitch-60',
        category: 'problem-solution',
        title: '60-Second Problem & Solution Hook',
        promptText: `In 60 seconds, explain why existing alternatives for ${projectName}'s domain fall short, and how your architectural approach directly resolves those limitations.`,
        guidance: [
          'Pinpoint the specific friction or failure mode in current solutions.',
          'Explain why your method is technically superior or fundamentally safer.',
          'Highlight measurable differentiation rather than buzzwords.',
        ],
        maxDurationSeconds: 60,
      },
    ];

    // 2. Project Explanation Prompts (max 180s)
    const overviewPrompts: VoicePracticePrompt[] = [
      {
        id: `prompt-overview-full-${projectId}`,
        mode: 'project-overview',
        category: 'project-overview',
        title: 'Comprehensive Project Overview',
        promptText: `Provide an end-to-end explanation of ${projectName}: the problem context, core capabilities, architecture, and who benefits from it.`,
        guidance: [
          'Structure your response: Problem → Architecture → Implementation → Outcomes.',
          'Reference concrete subsystems from your project rather than generalities.',
          'Convey how users interact with the system from input to output.',
        ],
        maxDurationSeconds: 180,
      },
      {
        id: `prompt-overview-problem-${projectId}`,
        mode: 'project-overview',
        category: 'problem-solution',
        title: 'Problem & Value Proposition',
        promptText: `Explain why ${projectName} was built and why this problem is technically challenging to solve cleanly.`,
        guidance: [
          'Describe the operational environment and user stakes.',
          'Address why a naive solution does not work.',
          'Explain the measurable value created by your implementation.',
        ],
        maxDurationSeconds: 180,
      },
    ];

    // 3. Technical Answer Prompts (max 180s)
    const technicalPrompts: VoicePracticePrompt[] = [
      {
        id: `prompt-tech-stack-${projectId}`,
        mode: 'technical-answer',
        category: 'architecture',
        title: techStack ? `Tech Stack Justification (${techStack})` : 'Technology Stack Justification',
        promptText: techStack
          ? `Defend your selection of ${techStack} in ${projectName}. Why were these specific libraries and patterns selected, and what alternatives were ruled out?`
          : `Defend your primary framework and architectural decisions in ${projectName}. Why was this structure chosen over alternatives?`,
        guidance: [
          'State specific requirements that motivated your stack selection.',
          'Contrast your choice against at least one realistic alternative.',
          'Acknowledge any trade-offs (e.g. bundle size, complexity, runtime overhead).',
        ],
        maxDurationSeconds: 180,
      },
      {
        id: `prompt-tech-security-${projectId}`,
        mode: 'technical-answer',
        category: 'defense',
        title: 'Security & Privacy Design',
        promptText: `Explain how data privacy, authentication, and security boundaries are enforced in ${projectName}. What guarantees do you provide to the user?`,
        guidance: [
          'Define the system trust boundary and data storage model.',
          'Explain how sensitive keys or user payloads are protected.',
          'State what information leaves the device versus what stays local.',
        ],
        maxDurationSeconds: 180,
      },
      {
        id: `prompt-tech-tradeoffs-${projectId}`,
        mode: 'technical-answer',
        category: 'defense',
        title: 'Limitations & Engineering Trade-offs',
        promptText: `Every non-trivial engineering project makes trade-offs. What are the primary trade-offs in ${projectName}, and what would break under 10x scale or extreme edge cases?`,
        guidance: [
          'Be honest and rigorous; judges value transparency over exaggerated claims.',
          'Explain memory, latency, or concurrency limits.',
          'Outline what engineering changes would be required for the next phase.',
        ],
        maxDurationSeconds: 180,
      },
    ];

    // 4. Judge Question Prompts (max 180s)
    // Gather dynamic questions from existing Judge sessions or Preparation Plan if available
    const judgePrompts: VoicePracticePrompt[] = [];

    // Check judge sessions for real questions
    const judgeSessions = judgeSessionRepository.getSessions(projectId);
    const seenQuestions = new Set<string>();

    for (const session of judgeSessions) {
      for (const attempt of session.attempts) {
        const qText = attempt.question.question;
        if (qText && !seenQuestions.has(qText) && judgePrompts.length < 3) {
          seenQuestions.add(qText);
          const catLabel = (attempt.question.category || 'Defense').toUpperCase();
          judgePrompts.push({
            id: `prompt-judge-from-sim-${attempt.id}`,
            mode: 'judge-question',
            category: 'questions',
            title: `Judge Cross-Examination: ${catLabel}`,
            promptText: qText,
            guidance: [
              `Target Category: ${catLabel}.`,
              'Answer directly within the first sentence; avoid filler.',
              'Provide grounded technical rationale substantiated by your codebase.',
              'Acknowledge edge cases or constraints without sounding defensive.',
            ],
            maxDurationSeconds: 180,
            sourceQuestionId: attempt.id,
          });
        }
      }
    }

    // Check preparation plan for generated practice questions
    const plan = preparationPlanRepository.getLatestPlan(projectId);
    if (plan && plan.likelyQuestions && judgePrompts.length < 4) {
      for (const pq of plan.likelyQuestions) {
        if (!seenQuestions.has(pq.question) && judgePrompts.length < 4) {
          seenQuestions.add(pq.question);
          judgePrompts.push({
            id: `prompt-plan-q-${pq.question.slice(0, 12).replace(/\W+/g, '')}`,
            mode: 'judge-question',
            category: 'questions',
            title: `Plan Practice: ${pq.category || 'Technical Defense'}`,
            promptText: pq.question,
            guidance: [
              'Target Question from your Preparation Plan.',
              'Maintain crisp technical focus.',
              'Substantiate claims with specific project implementation details.',
            ],
            maxDurationSeconds: 180,
          });
        }
      }
    }

    // Grounded fallback judge questions if no prior judge sessions exist
    if (judgePrompts.length === 0) {
      judgePrompts.push({
        id: `prompt-judge-fallback-arch-${projectId}`,
        mode: 'judge-question',
        category: 'architecture',
        title: 'Judge Probe: Component Failure & Isolation',
        promptText: `If an external dependency, network link, or background service fails in ${projectName}, how does the application degrade gracefully without corrupting local state?`,
        guidance: [
          'Describe your error boundaries and fallback handlers.',
          'Explain how state consistency is preserved.',
          'Demonstrate resilience under adverse conditions.',
        ],
        maxDurationSeconds: 180,
      });

      judgePrompts.push({
        id: `prompt-judge-fallback-scale-${projectId}`,
        mode: 'judge-question',
        category: 'defense',
        title: 'Judge Probe: Real-World Viability',
        promptText: `How do you prove that ${projectName} is more than a prototype? What evidence do you have regarding performance, edge cases, and security compliance?`,
        guidance: [
          'Reference verified capabilities rather than hypothetical future features.',
          'Discuss your testing or validation methodology.',
          'Maintain professional composure under aggressive cross-examination.',
        ],
        maxDurationSeconds: 180,
      });
    }

    return {
      'pitch-60': pitchPrompts,
      'project-overview': overviewPrompts,
      'technical-answer': technicalPrompts,
      'judge-question': judgePrompts,
    };
  }
}
