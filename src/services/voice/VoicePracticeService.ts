import {
  VoicePracticeMode,
  VoicePracticePrompt,
  VoicePracticeResult,
  VoicePracticeSession,
} from '../../types/voice';
import { ProjectContext } from '../../types/knowledge';
import { JudgeContextBuilder } from '../judge/JudgeContextBuilder';
import { aiProviderRouter } from '../ai/AIProviderRouter';
import { voiceSessionRepository } from './VoiceSessionRepository';

export class VoicePracticeService {
  /**
   * Evaluates a verbal response transcript using the unified AIProviderRouter
   * or a deterministic grounded rule-engine fallback if remote AI is offline.
   */
  async analyzeResponse(
    projectId: string,
    projectName: string,
    prompt: VoicePracticePrompt,
    transcript: string,
    durationSeconds: number,
    projectContext?: ProjectContext
  ): Promise<VoicePracticeSession> {
    const resolution = await aiProviderRouter.resolveProvider('voice-practice');
    const providerName = resolution.provider?.name || 'Demo / Offline Grounded Mode';
    const processingMode = resolution.status?.processingLocation === 'Cloud' ? 'remote' : 'local';

    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) {
      throw new Error('Cannot analyze empty transcript.');
    }

    const contextPrompt = projectContext
      ? JudgeContextBuilder.buildBaseContextPrompt(projectId, projectName, projectContext)
      : { systemContextPrompt: `Project Name: ${projectName}` };

    let result: VoicePracticeResult | null = null;

    // 1. Attempt unified router evaluation
    try {
      result = await aiProviderRouter.analyzeVoicePractice({
        projectId,
        projectName,
        prompt,
        transcript: cleanTranscript,
        durationSeconds,
        context: contextPrompt,
      });
    } catch (err) {
      console.warn('[VoicePracticeService] AI analysis error, using local fallback:', err);
    }

    // 2. Deterministic Local Grounded Evaluation Fallback
    if (!result) {
      result = this.evaluateLocally(prompt, cleanTranscript, durationSeconds, projectName, projectContext);
    }

    // 3. Construct session
    const session: VoicePracticeSession = {
      id: `v-sess-${Date.now()}`,
      projectId,
      createdAt: new Date().toISOString(),
      prompt,
      transcript: cleanTranscript,
      durationSeconds,
      result,
      providerName: result ? providerName : `${providerName} (Offline Rule Evaluator)`,
      processingMode: processingMode as 'local' | 'remote',
      audioRecorded: true,
    };

    // 4. Persist session
    voiceSessionRepository.saveSession(session);

    return session;
  }

  private validateCategory(
    cat: string | undefined,
    fallbackCat: string
  ): 'understanding' | 'clarity' | 'defense' | 'architecture' | 'questions' {
    const valid = ['understanding', 'clarity', 'defense', 'architecture', 'questions'];
    if (cat && valid.includes(cat)) {
      return cat as any;
    }
    if (fallbackCat.includes('pitch') || fallbackCat.includes('clarity')) return 'clarity';
    if (fallbackCat.includes('tech') || fallbackCat.includes('stack')) return 'defense';
    if (fallbackCat.includes('arch')) return 'architecture';
    if (fallbackCat.includes('judge') || fallbackCat.includes('probe')) return 'questions';
    return 'understanding';
  }

  /**
   * Deterministic local evaluation engine grounded in actual project keywords and rubrics
   */
  private evaluateLocally(
    prompt: VoicePracticePrompt,
    transcript: string,
    durationSeconds: number,
    projectName: string,
    projectContext?: ProjectContext
  ): VoicePracticeResult {
    const words = transcript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const lowerTranscript = transcript.toLowerCase();

    // Check project tech mentions
    const projectTechs = projectContext?.technologies || [];
    const matchedTechs = projectTechs.filter((t) => lowerTranscript.includes(t.toLowerCase()));

    // Check key concept mentions
    const matchedTopics = (projectContext?.potentialTopics || []).filter(
      (topic) => lowerTranscript.includes(topic.toLowerCase())
    );

    // Compute metrics
    const mentionsProjectName = lowerTranscript.includes(projectName.toLowerCase());
    const mentionsProblem =
      lowerTranscript.includes('problem') ||
      lowerTranscript.includes('issue') ||
      lowerTranscript.includes('challenge') ||
      lowerTranscript.includes('risk') ||
      lowerTranscript.includes('fail');
    const mentionsSolution =
      lowerTranscript.includes('solution') ||
      lowerTranscript.includes('build') ||
      lowerTranscript.includes('solve') ||
      lowerTranscript.includes('provide') ||
      lowerTranscript.includes('approach');
    const mentionsArchitecture =
      lowerTranscript.includes('architect') ||
      lowerTranscript.includes('pipeline') ||
      lowerTranscript.includes('api') ||
      lowerTranscript.includes('database') ||
      lowerTranscript.includes('component') ||
      lowerTranscript.includes('client') ||
      lowerTranscript.includes('server');

    // Words per minute pacing check
    const durationMinutes = Math.max(durationSeconds / 60, 0.2);
    const wpm = Math.round(wordCount / durationMinutes);
    const isPacingGood = wpm >= 110 && wpm <= 165;

    const strengths: string[] = [];
    const improvements: string[] = [];
    const missingPoints: string[] = [];
    const projectEvidence: string[] = [];
    const recommendedPractice: string[] = [];

    // Evaluate Strengths & Completeness
    if (wordCount < 10) {
      improvements.push(`Response was very brief (${wordCount} words). Expand with specific project mechanisms to demonstrate technical depth to judges.`);
      missingPoints.push('Substantive technical explanation: 1-2 sentences are not enough to evaluate technical competence.');
    } else if (wordCount > 250 && durationSeconds <= 60) {
      improvements.push(`Response was extremely dense (${wordCount} words in ${durationSeconds}s). Prune secondary details to avoid overwhelming judges.`);
    }

    if (mentionsProjectName) {
      strengths.push(`Clearly identified project identity (${projectName}) in verbal introduction.`);
    }
    if (matchedTechs.length > 0) {
      strengths.push(`Substantiated explanation with verified project technologies: ${matchedTechs.join(', ')}.`);
      projectEvidence.push(`Matches codebase dependencies: ${matchedTechs.join(', ')}.`);
    }
    if (isPacingGood) {
      strengths.push(`Maintained an effective presentation pacing (~${wpm} words per minute).`);
    } else if (wpm > 175) {
      improvements.push(`Delivery pacing was rapid (${wpm} wpm). Aim for 120-150 wpm for judge clarity.`);
    } else if (wpm < 90 && durationSeconds > 20) {
      improvements.push(`Delivery pacing was cautious (${wpm} wpm). Increase cadence to cover more ground.`);
    }

    if (prompt.mode === 'pitch-60') {
      if (durationSeconds <= 60 && durationSeconds >= 35) {
        strengths.push(`Respects the 60-second limit strictly (${durationSeconds}s elapsed).`);
      } else if (durationSeconds > 60) {
        improvements.push(`Exceeded 60-second competition threshold by ${durationSeconds - 60} seconds.`);
      }

      if (mentionsProblem && mentionsSolution) {
        strengths.push('Articulated both problem statement and solution thesis.');
      } else if (!mentionsProblem) {
        missingPoints.push('Clear problem hook: Define why the target user needs this solution.');
      } else if (!mentionsSolution) {
        missingPoints.push('Direct value proposition: Conclude with what the product actually delivers.');
      }
    }

    if (prompt.mode === 'technical-answer' || prompt.mode === 'judge-question') {
      if (!mentionsArchitecture && !matchedTechs.length) {
        improvements.push('Answer lacked specific architectural components or stack details.');
        missingPoints.push('Concrete implementation details: Component boundaries and API flows.');
      }
      if (
        lowerTranscript.includes('always') ||
        lowerTranscript.includes('never') ||
        lowerTranscript.includes('perfect')
      ) {
        improvements.push('Avoid absolute claims ("never", "perfect"); judges favor measured trade-off discussions.');
      }
    }

    if (strengths.length === 0) {
      strengths.push('Attempted verbal delivery within allocated time boundary.');
    }

    if (missingPoints.length === 0 && projectTechs.length > matchedTechs.length) {
      const omitted = projectTechs.filter((t) => !matchedTechs.includes(t)).slice(0, 2);
      if (omitted.length > 0) {
        missingPoints.push(`Relevant project stack components not mentioned: ${omitted.join(', ')}.`);
      }
    }

    // Recommendations
    if (improvements.length > 0) {
      recommendedPractice.push(`Drill this answer again focusing on: ${improvements[0]}`);
    } else {
      recommendedPractice.push('Practice fielding unexpected follow-up cross-examination questions in Judge Mode.');
    }

    // Scoring (0-5 scale)
    let score = 3.0;
    if (mentionsProjectName) score += 0.5;
    if (matchedTechs.length > 0) score += 0.5;
    if (mentionsProblem && mentionsSolution) score += 0.5;
    if (isPacingGood) score += 0.3;
    if (wordCount < 40) score -= 1.0;
    score = Math.min(5.0, Math.max(1.5, Number(score.toFixed(1))));

    const primaryCat = this.validateCategory(undefined, prompt.category);

    return {
      mode: prompt.mode,
      transcript,
      summary: `Verbal delivery for "${prompt.title}" (${wordCount} words in ${durationSeconds}s) evaluated against active project context.`,
      strengths,
      improvements: improvements.length > 0 ? improvements : ['Maintain this level of concision in live competition.'],
      missingPoints: missingPoints.length > 0 ? missingPoints : ['All core prompt constraints addressed.'],
      projectEvidence: projectEvidence.length > 0 ? projectEvidence : ['Grounded in active project context.'],
      recommendedPractice,
      accuracyScore: score,
      clarityScore: isPacingGood ? Math.min(5, score + 0.2) : Math.max(2, score - 0.5),
      defenseScore: score,
      overallRubricScore: score,
      primaryCategory: primaryCat,
    };
  }
}

export const voicePracticeService = new VoicePracticeService();
