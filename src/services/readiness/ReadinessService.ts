import {
  ReadinessReport,
  CategoryAssessment,
  ReadinessPracticeRecommendation,
  NextBestAction,
  ReadinessLevel,
  OverallReadinessLevel,
} from '../../types/readiness';
import { ProjectContext } from '../../types/knowledge';
import { judgeSessionRepository } from '../judge/JudgeSessionRepository';
import { voiceSessionRepository } from '../voice/VoiceSessionRepository';
import { ReadinessEvidenceExtractor, CORE_CATEGORIES } from './ReadinessEvidenceExtractor';
import { readinessReportRepository } from './ReadinessReportRepository';
import { JudgeContextBuilder } from '../judge/JudgeContextBuilder';
import { aiProviderRouter } from '../ai/AIProviderRouter';

export class ReadinessService {
  /**
   * Generates or refreshes the presentation readiness report for a project.
   */
  async generateReport(
    projectId: string,
    projectName: string,
    projectContext?: ProjectContext
  ): Promise<ReadinessReport> {
    const sessions = judgeSessionRepository.getSessions(projectId);
    const voiceSessions = voiceSessionRepository.getSessions(projectId);

    // 1. Extract and map evidence deterministically
    const extraction = ReadinessEvidenceExtractor.extractEvidenceFromSessions(sessions, voiceSessions);

    // 2. Determine AI Provider status via unified router
    const resolution = await aiProviderRouter.resolveProvider('readiness');
    const providerName = resolution.provider?.name || 'Demo / Offline Grounded Mode';
    const processingMode = resolution.status?.processingLocation === 'Cloud' ? 'remote' : 'local';

    // 3. If no sessions or 0 evidence: return clean empty diagnostic state
    if (extraction.overallLevel === 'not-evaluated') {
      const emptyReport: ReadinessReport = {
        id: `rep-${Date.now()}`,
        projectId,
        generatedAt: new Date().toISOString(),
        overallLevel: 'not-evaluated',
        overallScore: 0,
        overallExplanation:
          'No completed presentation defense sessions found. Complete a simulation in Judge Mode to generate diagnostic evidence.',
        categories: extraction.categories,
        strengths: [],
        weaknesses: [],
        recommendedPractice: [
          {
            id: 'rec-init',
            area: 'First Defense Simulation',
            whyItMatters: 'Judges evaluate spontaneous reasoning and technical mastery under pressure.',
            whatToPractice: 'Launch a 5 or 10-minute Judge Mode simulation to establish your baseline.',
            priority: 'high',
            relatedCategory: 'defense',
          },
        ],
        nextBestAction: {
          title: 'Launch First Judge Simulation',
          explanation:
            'Aegis requires at least one completed defense simulation before calculating verified readiness.',
          actionCategory: 'defense',
          targetRoute: 'judge-mode',
        },
        evidence: [],
        sessionsUsed: [],
        providerName,
        processingMode,
      };

      return emptyReport;
    }

    // 4. If evidence exists, attempt AI narrative synthesis
    const contextPrompt = projectContext
      ? JudgeContextBuilder.buildBaseContextPrompt(projectId, projectName, projectContext)
      : { systemContextPrompt: 'Project: ' + projectName };

    const sessionsSummary = `Total defense sessions recorded: ${extraction.sessionsUsed.length}. Evidence points: ${extraction.evidenceItems.length}. Overall rubric score: ${extraction.overallScore}/5.`;

    let synthesized: any = null;

    try {
      synthesized = await aiProviderRouter.synthesizeReadinessReport({
        projectId,
        projectName,
        categories: extraction.categories,
        overallLevel: extraction.overallLevel,
        overallScore: extraction.overallScore,
        evidenceItems: extraction.evidenceItems,
        sessionsSummary,
        context: contextPrompt,
      });
    } catch (err) {
      console.warn('[ReadinessService] Synthesis error, falling back to local defaults:', err);
    }

    // 5. Merge AI synthesis with verified category rubric evidence
    let overallExplanation = '';
    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let recommendedPractice: ReadinessPracticeRecommendation[] = [];
    let nextBestAction: NextBestAction;

    if (synthesized && typeof synthesized === 'object') {
      overallExplanation =
        synthesized.overallExplanation ||
        this.generateDefaultOverallExplanation(extraction.overallLevel, extraction.overallScore);

      // Merge category narratives if provided
      if (synthesized.categoryNarratives) {
        extraction.categories = extraction.categories.map((c) => {
          const nar = synthesized.categoryNarratives[c.id];
          if (nar && nar.explanation && c.level !== 'not-evaluated') {
            return {
              ...c,
              explanation: nar.explanation,
              recommendation: nar.recommendation || c.recommendation,
            };
          }
          return c;
        });
      }

      strengths = Array.isArray(synthesized.strengths) && synthesized.strengths.length > 0
        ? synthesized.strengths
        : this.extractStrengthsFromCategories(extraction.categories);

      weaknesses = Array.isArray(synthesized.weaknesses) && synthesized.weaknesses.length > 0
        ? synthesized.weaknesses
        : this.extractWeaknessesFromCategories(extraction.categories);

      recommendedPractice = Array.isArray(synthesized.recommendedPractice) && synthesized.recommendedPractice.length > 0
        ? synthesized.recommendedPractice.map((r: any, i: number) => ({
            id: `rec-${i + 1}`,
            area: r.area || 'Technical Defense',
            whyItMatters: r.whyItMatters || 'Essential for competition judging.',
            whatToPractice: r.whatToPractice || 'Rehearse architectural boundaries and trade-offs.',
            priority: r.priority || 'high',
            relatedCategory: r.relatedCategory || 'defense',
          }))
        : this.generateDefaultRecommendations(extraction.categories);

      nextBestAction = synthesized.nextBestAction && synthesized.nextBestAction.title
        ? {
            title: synthesized.nextBestAction.title,
            explanation: synthesized.nextBestAction.explanation || 'Focus on your largest identified preparation gap.',
            actionCategory: synthesized.nextBestAction.actionCategory || 'defense',
            targetRoute: synthesized.nextBestAction.targetRoute || 'judge-mode',
          }
        : this.deriveNextBestAction(extraction.categories);
    } else {
      // Offline / Local Deterministic Synthesis
      overallExplanation = this.generateDefaultOverallExplanation(
        extraction.overallLevel,
        extraction.overallScore
      );
      strengths = this.extractStrengthsFromCategories(extraction.categories);
      weaknesses = this.extractWeaknessesFromCategories(extraction.categories);
      recommendedPractice = this.generateDefaultRecommendations(extraction.categories);
      nextBestAction = this.deriveNextBestAction(extraction.categories);
    }

    const report: ReadinessReport = {
      id: `rep-${Date.now()}`,
      projectId,
      generatedAt: new Date().toISOString(),
      overallLevel: extraction.overallLevel,
      overallScore: extraction.overallScore,
      overallExplanation,
      categories: extraction.categories,
      strengths,
      weaknesses,
      recommendedPractice,
      nextBestAction,
      evidence: extraction.evidenceItems,
      sessionsUsed: extraction.sessionsUsed,
      comparison: extraction.comparison,
      providerName: synthesized ? providerName : `${providerName} (Offline Rule Synthesis)`,
      processingMode: synthesized ? processingMode : 'local',
    };

    // 6. Persist report locally in project-isolated repository
    readinessReportRepository.saveReport(report);

    return report;
  }

  private generateDefaultOverallExplanation(
    level: OverallReadinessLevel,
    score: number
  ): string {
    switch (level) {
      case 'strong-defense':
        return `High presentation readiness demonstrated across multiple defense categories (average score ${score}/5). Technical explanations are grounded and substantiated under questioning.`;
      case 'presentation-ready':
        return `Solid presentation baseline established (${score}/5). Core project concepts and architectural pathways are defended clearly, with focused preparation needed on secondary trade-offs.`;
      case 'building-confidence':
        return `Defense capabilities are developing (${score}/5). Basic problem/solution context is understood, but cross-examination exposed gaps in technical implementation and failure recovery.`;
      case 'early-preparation':
        return `Initial preparation phase (${score}/5). Inquiries revealed critical gaps in architecture or technical defense that require focused rehearsal before live judging.`;
      default:
        return 'No evaluable simulation evidence recorded yet.';
    }
  }

  private extractStrengthsFromCategories(categories: CategoryAssessment[]): string[] {
    const list: string[] = [];
    for (const c of categories) {
      if (c.strengths && c.strengths.length > 0) {
        list.push(`${c.name}: ${c.strengths[0]}`);
      }
    }
    return list.length > 0
      ? list.slice(0, 4)
      : ['Basic project scope articulated in simulation attempts.'];
  }

  private extractWeaknessesFromCategories(categories: CategoryAssessment[]): string[] {
    const list: string[] = [];
    for (const c of categories) {
      if (c.gaps && c.gaps.length > 0) {
        list.push(`${c.name}: ${c.gaps[0]}`);
      }
    }
    return list.length > 0
      ? list.slice(0, 4)
      : ['Articulating non-functional trade-offs and performance limits under pressure.'];
  }

  private generateDefaultRecommendations(categories: CategoryAssessment[]): ReadinessPracticeRecommendation[] {
    const weakCategories = [...categories]
      .filter((c) => c.level !== 'not-evaluated')
      .sort((a, b) => a.score - b.score);

    if (weakCategories.length === 0) {
      return [
        {
          id: 'rec-1',
          area: 'Technical Architecture Drill',
          whyItMatters: 'Judges challenge component boundaries and API contracts.',
          whatToPractice: 'Practice tracing a request end-to-end in 60 seconds.',
          priority: 'high',
          relatedCategory: 'architecture',
        },
      ];
    }

    return weakCategories.slice(0, 3).map((c, idx) => ({
      id: `rec-${idx + 1}`,
      area: c.name,
      whyItMatters: `Identified as your lowest relative score (${c.score}/5) with ${c.evidenceCount} verified probe(s).`,
      whatToPractice: c.recommendation,
      priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
      relatedCategory: c.id,
    }));
  }

  private deriveNextBestAction(categories: CategoryAssessment[]): NextBestAction {
    const evaluated = categories.filter((c) => c.level !== 'not-evaluated');
    if (evaluated.length === 0) {
      return {
        title: 'Launch Judge Mode Simulation',
        explanation: 'Complete your first defense session to generate diagnostic readiness metrics.',
        actionCategory: 'defense',
        targetRoute: 'judge-mode',
      };
    }

    const lowest = [...evaluated].sort((a, b) => a.score - b.score)[0];

    return {
      title: `Practice ${lowest.name} in Judge Mode`,
      explanation: `Your lowest evaluated category is ${lowest.name} (${lowest.score}/5). Rehearsing this specific focus area will provide the greatest lift in presentation readiness.`,
      actionCategory: lowest.id,
      targetRoute: 'judge-mode',
    };
  }
}

export const readinessService = new ReadinessService();
