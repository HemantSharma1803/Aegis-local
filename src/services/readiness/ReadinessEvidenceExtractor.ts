import { JudgeSession, QuestionAttempt } from '../../types/judge';
import { VoicePracticeSession } from '../../types/voice';
import {
  CategoryAssessment,
  ReadinessEvidenceItem,
  ReadinessLevel,
  OverallReadinessLevel,
  ReadinessPracticeRecommendation,
  NextBestAction,
  ReadinessSessionComparison,
  CategoryProgress,
} from '../../types/readiness';

export const CORE_CATEGORIES = [
  {
    id: 'understanding',
    name: 'Project Understanding',
    description: 'Grasp of fundamental technical scope, limitations, and operational mission.',
  },
  {
    id: 'clarity',
    name: 'Problem/Solution Clarity',
    description: 'Concision and resonance in conveying why existing solutions fail and how your approach succeeds.',
  },
  {
    id: 'defense',
    name: 'Technical Defense',
    description: 'Ability to defend algorithmic choices, resource benchmarks, and hardware constraints.',
  },
  {
    id: 'architecture',
    name: 'Architecture Explanation',
    description: 'Clarity when tracing dataflow across subsystems, APIs, and boundary contracts.',
  },
  {
    id: 'questions',
    name: 'Question Handling',
    description: 'Poise, precision, and absence of deflection when addressing unexpected judge probes.',
  },
];

export class ReadinessEvidenceExtractor {
  static extractEvidenceFromSessions(
    sessions: JudgeSession[],
    voiceSessions: VoicePracticeSession[] = []
  ): {
    evidenceItems: ReadinessEvidenceItem[];
    categories: CategoryAssessment[];
    overallLevel: OverallReadinessLevel;
    overallScore: number;
    sessionsUsed: string[];
    comparison?: ReadinessSessionComparison;
  } {
    const validSessions = sessions.filter(
      (s) => s.attempts && s.attempts.length > 0 && s.attempts.some((a) => a.answer || a.skipped)
    );

    const validVoiceSessions = voiceSessions.filter(
      (vs) => vs.result && vs.transcript && vs.transcript.trim().length > 0
    );

    if (validSessions.length === 0 && validVoiceSessions.length === 0) {
      // Empty state: No evaluated scores
      const emptyCategories: CategoryAssessment[] = CORE_CATEGORIES.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        level: 'not-evaluated',
        score: 0,
        evidenceCount: 0,
        evidence: [],
        strengths: [],
        gaps: [],
        explanation: 'No defense session or voice practice evidence recorded for this category yet.',
        recommendation: 'Complete a Judge Mode simulation or Voice Practice session covering this area to generate diagnostic evidence.',
      }));

      return {
        evidenceItems: [],
        categories: emptyCategories,
        overallLevel: 'not-evaluated',
        overallScore: 0,
        sessionsUsed: [],
      };
    }

    const allEvidenceItems: ReadinessEvidenceItem[] = [];
    const categoryBuckets: Record<
      string,
      {
        evidence: ReadinessEvidenceItem[];
        strengths: string[];
        gaps: string[];
        scores: number[];
      }
    > = {
      understanding: { evidence: [], strengths: [], gaps: [], scores: [] },
      clarity: { evidence: [], strengths: [], gaps: [], scores: [] },
      defense: { evidence: [], strengths: [], gaps: [], scores: [] },
      architecture: { evidence: [], strengths: [], gaps: [], scores: [] },
      questions: { evidence: [], strengths: [], gaps: [], scores: [] },
    };

    const sessionsUsed: string[] = [];

    // Process sessions (newest first)
    for (const session of validSessions) {
      sessionsUsed.push(session.id);
      const sessionDateStr = new Date(session.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      for (const attempt of session.attempts) {
        if (!attempt.answer && !attempt.skipped) continue;

        const catId = this.mapQuestionToCategoryId(attempt);
        const isSkipped = Boolean(attempt.skipped);
        const evalData = attempt.evaluation;

        const isStrength =
          !isSkipped &&
          Boolean(
            evalData &&
              evalData.strengths.length >= (evalData.gaps.length || 0) &&
              (evalData.overallAssessment.toLowerCase().includes('solid') ||
                evalData.overallAssessment.toLowerCase().includes('sound') ||
                evalData.overallAssessment.toLowerCase().includes('good') ||
                evalData.overallAssessment.toLowerCase().includes('clear') ||
                attempt.answer!.length > 100)
          );

        const isGap = isSkipped || (evalData && evalData.gaps.length > evalData.strengths.length);

        const evItem: ReadinessEvidenceItem = {
          id: `ev-${session.id}-${attempt.id}`,
          sourceType: 'judge-session',
          sourceId: session.id,
          sourceDate: sessionDateStr,
          category: catId,
          questionText: attempt.question.question,
          answerSnippet: attempt.answer
            ? attempt.answer.length > 180
              ? `${attempt.answer.slice(0, 180)}...`
              : attempt.answer
            : '(Skipped Question)',
          evaluationSnippet: evalData?.overallAssessment || (isSkipped ? 'Question was skipped under judge timer.' : undefined),
          strengthOrGap: isSkipped ? 'gap' : isStrength ? 'strength' : isGap ? 'gap' : 'neutral',
          description: isSkipped
            ? `Skipped judge probe on "${attempt.question.question}".`
            : `Defended question "${attempt.question.question}": ${evalData?.overallAssessment || 'Answer registered.'}`,
        };

        allEvidenceItems.push(evItem);

        // Put in primary category
        if (categoryBuckets[catId]) {
          categoryBuckets[catId].evidence.push(evItem);
          if (evalData?.strengths) {
            categoryBuckets[catId].strengths.push(...evalData.strengths);
          }
          if (evalData?.gaps) {
            categoryBuckets[catId].gaps.push(...evalData.gaps);
          }
          if (isSkipped) {
            categoryBuckets[catId].gaps.push(`Skipped question: "${attempt.question.question}"`);
          }

          // Compute attempt rubric score: 1 to 5
          const score = this.calculateAttemptScore(attempt);
          categoryBuckets[catId].scores.push(score);
        }

        // Also add to 'Question Handling'
        const qScore = isSkipped ? 1 : Math.min(5, Math.max(2, (attempt.answer?.length || 0) > 120 ? 4 : 3));
        categoryBuckets.questions.evidence.push(evItem);
        categoryBuckets.questions.scores.push(qScore);
        if (isSkipped) {
          categoryBuckets.questions.gaps.push('Deflected / skipped timed question.');
        } else if (attempt.answer && attempt.answer.length > 120) {
          categoryBuckets.questions.strengths.push('Provided structured response under judge cross-examination.');
        }
      }
    }

    // Process voice practice sessions
    for (const vSession of validVoiceSessions) {
      sessionsUsed.push(vSession.id);
      const vDateStr = new Date(vSession.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const res = vSession.result!;
      const catId = res.primaryCategory || 'understanding';
      const isStrength = res.overallRubricScore >= 3.5;
      const isGap = res.overallRubricScore <= 2.5;

      const vEvItem: ReadinessEvidenceItem = {
        id: `ev-voice-${vSession.id}`,
        sourceType: 'voice-practice',
        sourceId: vSession.id,
        sourceDate: vDateStr,
        category: catId,
        questionText: vSession.prompt.promptText,
        answerSnippet:
          vSession.transcript.length > 180
            ? `${vSession.transcript.slice(0, 180)}...`
            : vSession.transcript,
        evaluationSnippet: res.summary,
        strengthOrGap: isStrength ? 'strength' : isGap ? 'gap' : 'neutral',
        description: `Voice Practice (${vSession.prompt.title}, ${vSession.durationSeconds}s): ${res.summary}`,
      };

      allEvidenceItems.push(vEvItem);

      if (categoryBuckets[catId]) {
        categoryBuckets[catId].evidence.push(vEvItem);
        if (res.strengths) {
          categoryBuckets[catId].strengths.push(...res.strengths);
        }
        if (res.improvements) {
          categoryBuckets[catId].gaps.push(...res.improvements);
        }
        if (res.missingPoints) {
          categoryBuckets[catId].gaps.push(...res.missingPoints);
        }
        categoryBuckets[catId].scores.push(res.overallRubricScore);
      }

      // Voice Practice also contributes to Communication / Question Handling
      if (catId !== 'questions' && (vSession.prompt.mode === 'judge-question' || vSession.prompt.mode === 'technical-answer')) {
        categoryBuckets.questions.evidence.push(vEvItem);
        categoryBuckets.questions.scores.push(res.defenseScore || res.overallRubricScore);
      }

      if (catId !== 'clarity' && (vSession.prompt.mode === 'pitch-60' || vSession.prompt.mode === 'project-overview')) {
        categoryBuckets.clarity.evidence.push(vEvItem);
        categoryBuckets.clarity.scores.push(res.clarityScore || res.overallRubricScore);
      }
    }

    // Assemble category assessments
    const categories: CategoryAssessment[] = CORE_CATEGORIES.map((cat) => {
      const bucket = categoryBuckets[cat.id];
      const count = bucket.evidence.length;

      if (count === 0) {
        return {
          id: cat.id,
          name: cat.name,
          description: cat.description,
          level: 'not-evaluated',
          score: 0,
          evidenceCount: 0,
          evidence: [],
          strengths: [],
          gaps: [],
          explanation: 'No defense session evidence recorded for this category yet.',
          recommendation: `Run a Judge Mode session focused on ${cat.name} to establish verified evidence.`,
        };
      }

      // Average score on 0 to 5 rubric
      const avgScore =
        bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length;
      const roundedScore = Math.round(avgScore * 10) / 10;
      const level = this.mapScoreToLevel(roundedScore);

      const uniqueStrengths = Array.from(new Set(bucket.strengths)).slice(0, 3);
      const uniqueGaps = Array.from(new Set(bucket.gaps)).slice(0, 3);

      const explanation = this.generateCategoryExplanation(
        cat.name,
        level,
        roundedScore,
        count,
        uniqueStrengths,
        uniqueGaps
      );

      const recommendation = this.generateCategoryRecommendation(
        cat.name,
        level,
        uniqueGaps
      );

      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        level,
        score: roundedScore,
        evidenceCount: count,
        evidence: bucket.evidence,
        strengths: uniqueStrengths,
        gaps: uniqueGaps,
        explanation,
        recommendation,
      };
    });

    // Calculate Overall Readiness
    const evaluatedCategories = categories.filter((c) => c.level !== 'not-evaluated');
    let overallLevel: OverallReadinessLevel = 'not-evaluated';
    let overallScore = 0;

    if (evaluatedCategories.length > 0) {
      const sum = evaluatedCategories.reduce((acc, c) => acc + c.score, 0);
      overallScore = Math.round((sum / evaluatedCategories.length) * 10) / 10;

      const defenseCat = categories.find((c) => c.id === 'defense');
      const archCat = categories.find((c) => c.id === 'architecture');
      const criticalWeak =
        (defenseCat && defenseCat.score > 0 && defenseCat.score < 2) ||
        (archCat && archCat.score > 0 && archCat.score < 2);

      if (overallScore < 2.0 || criticalWeak) {
        overallLevel = 'early-preparation';
      } else if (overallScore < 3.2) {
        overallLevel = 'building-confidence';
      } else if (overallScore < 4.2) {
        overallLevel = 'presentation-ready';
      } else {
        overallLevel = evaluatedCategories.length >= 3 ? 'strong-defense' : 'presentation-ready';
      }
    }

    // Multi-session comparison
    let comparison: ReadinessSessionComparison | undefined;
    if (validSessions.length >= 2) {
      const latest = validSessions[0];
      const earlier = validSessions[validSessions.length - 1];
      comparison = this.compareSessions(earlier, latest);
    }

    return {
      evidenceItems: allEvidenceItems,
      categories,
      overallLevel,
      overallScore,
      sessionsUsed,
      comparison,
    };
  }

  private static mapQuestionToCategoryId(attempt: QuestionAttempt): string {
    const cat = (attempt.question.category || '').toLowerCase();
    const qText = attempt.question.question.toLowerCase();

    if (cat.includes('architect') || qText.includes('architect') || qText.includes('subsystem') || qText.includes('boundary')) {
      return 'architecture';
    }
    if (cat.includes('problem') || cat.includes('solution') || qText.includes('problem') || qText.includes('solution') || qText.includes('why')) {
      return 'clarity';
    }
    if (
      cat.includes('tech') ||
      cat.includes('trade') ||
      cat.includes('security') ||
      cat.includes('fail') ||
      qText.includes('trade-off') ||
      qText.includes('latency') ||
      qText.includes('constraint') ||
      qText.includes('threat')
    ) {
      return 'defense';
    }
    if (cat.includes('project') || cat.includes('overview') || qText.includes('scope')) {
      return 'understanding';
    }

    return 'defense'; // default technical category
  }

  private static calculateAttemptScore(attempt: QuestionAttempt): number {
    if (attempt.skipped) return 1;
    const answer = attempt.answer || '';
    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
    const evalData = attempt.evaluation;

    let score = 3; // base Competent

    if (wordCount < 15) {
      score = 2; // terse
    }

    if (evalData) {
      const strLen = evalData.strengths.length;
      const gapLen = evalData.gaps.length;
      if (strLen > gapLen && wordCount >= 25) {
        score = 4;
      }
      if (strLen >= 2 && gapLen === 0 && wordCount >= 40) {
        score = 5;
      }
      if (gapLen > strLen) {
        score = Math.max(1, score - 1);
      }
      if (evalData.corrections && evalData.corrections.length > 0) {
        score = Math.max(1, score - 1);
      }
    }

    return score;
  }

  private static mapScoreToLevel(score: number): ReadinessLevel {
    if (score === 0) return 'not-evaluated';
    if (score <= 2.2) return 'developing';
    if (score <= 3.6) return 'competent';
    return 'strong';
  }

  private static generateCategoryExplanation(
    name: string,
    level: ReadinessLevel,
    score: number,
    evidenceCount: number,
    strengths: string[],
    gaps: string[]
  ): string {
    const strengthStr = strengths.length > 0 ? strengths[0] : 'core technical principles';
    const gapStr = gaps.length > 0 ? gaps[0] : 'mitigation trade-offs';

    switch (level) {
      case 'strong':
        return `Demonstrated commanding defense in ${name} across ${evidenceCount} verified probe${evidenceCount > 1 ? 's' : ''}. Key strength: ${strengthStr}.`;
      case 'competent':
        return `Addressed ${name} questions with sound engineering reasoning, though follow-ups revealed opportunities to elaborate on ${gapStr}.`;
      case 'developing':
        return `Foundational defense established, but inquiries identified vulnerabilities around ${gapStr}.`;
      default:
        return 'Insufficient evidence collected to form an objective evaluation.';
    }
  }

  private static generateCategoryRecommendation(
    name: string,
    level: ReadinessLevel,
    gaps: string[]
  ): string {
    const target = gaps.length > 0 ? gaps[0] : 'architectural constraints and edge cases';
    switch (level) {
      case 'strong':
        return `Maintain sharpness by practicing rapid 30-second summaries of ${target}.`;
      case 'competent':
        return `Rehearse explaining ${target} directly connecting it to your verified project implementation.`;
      case 'developing':
        return `Focus preparation on ${target}; review corresponding project files and run another Technical simulation.`;
      default:
        return `Run a simulation focusing on ${name} to establish your initial diagnostic baseline.`;
    }
  }

  private static compareSessions(
    earlier: JudgeSession,
    latest: JudgeSession
  ): ReadinessSessionComparison {
    const earlierDate = new Date(earlier.startedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const latestDate = new Date(latest.startedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    const categoryChanges: CategoryProgress[] = [];

    for (const cat of CORE_CATEGORIES) {
      const earlierAttempts = earlier.attempts.filter(
        (a) => this.mapQuestionToCategoryId(a) === cat.id && (a.answer || a.skipped)
      );
      const latestAttempts = latest.attempts.filter(
        (a) => this.mapQuestionToCategoryId(a) === cat.id && (a.answer || a.skipped)
      );

      if (earlierAttempts.length > 0 && latestAttempts.length > 0) {
        const pScore = Math.round(
          (earlierAttempts.reduce((acc, a) => acc + this.calculateAttemptScore(a), 0) /
            earlierAttempts.length) *
            10
        ) / 10;
        const cScore = Math.round(
          (latestAttempts.reduce((acc, a) => acc + this.calculateAttemptScore(a), 0) /
            latestAttempts.length) *
            10
        ) / 10;

        const prevLevel = this.mapScoreToLevel(pScore);
        const curLevel = this.mapScoreToLevel(cScore);

        let trend: 'improved' | 'steady' | 'regressed' = 'steady';
        if (cScore > pScore + 0.3) trend = 'improved';
        else if (cScore < pScore - 0.3) trend = 'regressed';

        categoryChanges.push({
          categoryId: cat.id,
          categoryName: cat.name,
          previousLevel: prevLevel,
          currentLevel: curLevel,
          previousScore: pScore,
          currentScore: cScore,
          trend,
          explanation:
            trend === 'improved'
              ? `Advancement demonstrated from ${prevLevel} (${pScore}/5) to ${curLevel} (${cScore}/5).`
              : trend === 'regressed'
              ? `Increased judge skepticism in latest session exposed deeper preparation needs.`
              : `Consistent defense level maintained across sessions (${cScore}/5).`,
        });
      }
    }

    const improvedCount = categoryChanges.filter((c) => c.trend === 'improved').length;
    let summary = 'Cross-session comparison shows consistent defense performance.';
    if (improvedCount > 0) {
      summary = `Noticeable progress observed across ${improvedCount} technical area${improvedCount > 1 ? 's' : ''} since the earlier simulation.`;
    }

    return {
      earlierSessionId: earlier.id,
      earlierDate,
      latestSessionId: latest.id,
      latestDate,
      categoryChanges,
      overallComparisonSummary: summary,
    };
  }
}
