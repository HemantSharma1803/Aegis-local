import { JudgeSession } from '../../types/judge';

const JUDGE_SESSION_PREFIX = 'aegis_local_judge_sessions_';

export class JudgeSessionRepository {
  private getKey(projectId: string): string {
    return `${JUDGE_SESSION_PREFIX}${projectId}`;
  }

  getSessions(projectId: string): JudgeSession[] {
    try {
      const raw = localStorage.getItem(this.getKey(projectId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[JudgeSessionRepository] Failed to read sessions:', err);
      return [];
    }
  }

  getSession(projectId: string, sessionId: string): JudgeSession | null {
    const sessions = this.getSessions(projectId);
    return sessions.find((s) => s.id === sessionId) || null;
  }

  getActiveSession(projectId: string): JudgeSession | null {
    const sessions = this.getSessions(projectId);
    return sessions.find((s) => s.status === 'active') || null;
  }

  saveSession(session: JudgeSession): void {
    try {
      const sessions = this.getSessions(session.projectId);
      const existingIdx = sessions.findIndex((s) => s.id === session.id);
      let updated: JudgeSession[];
      if (existingIdx >= 0) {
        updated = [...sessions];
        updated[existingIdx] = session;
      } else {
        updated = [session, ...sessions].slice(0, 20); // Keep last 20 sessions
      }
      localStorage.setItem(this.getKey(session.projectId), JSON.stringify(updated));
    } catch (err) {
      console.error('[JudgeSessionRepository] Failed to save session:', err);
    }
  }

  updateSession(session: JudgeSession): void {
    this.saveSession(session);
  }

  deleteSession(projectId: string, sessionId: string): void {
    try {
      const sessions = this.getSessions(projectId);
      const filtered = sessions.filter((s) => s.id !== sessionId);
      localStorage.setItem(this.getKey(projectId), JSON.stringify(filtered));
    } catch (err) {
      console.error('[JudgeSessionRepository] Failed to delete session:', err);
    }
  }

  clearSessions(projectId: string): void {
    try {
      localStorage.removeItem(this.getKey(projectId));
    } catch (err) {
      console.warn('[JudgeSessionRepository] Failed to clear sessions:', err);
    }
  }
}

export const judgeSessionRepository = new JudgeSessionRepository();
