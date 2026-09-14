import { VoicePracticeSession } from '../../types/voice';

export class VoiceSessionRepository {
  private getStorageKey(projectId: string): string {
    return `aegis_voice_sessions_${projectId}`;
  }

  getSessions(projectId: string): VoicePracticeSession[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(projectId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return [];
    } catch (err) {
      console.warn('[VoiceSessionRepository] Failed to read sessions from localStorage:', err);
      return [];
    }
  }

  saveSession(session: VoicePracticeSession): void {
    try {
      const existing = this.getSessions(session.projectId);
      const filtered = existing.filter((s) => s.id !== session.id);
      filtered.unshift(session);
      // Retain up to 30 voice practice sessions per project
      const capped = filtered.slice(0, 30);
      localStorage.setItem(this.getStorageKey(session.projectId), JSON.stringify(capped));
    } catch (err) {
      console.warn('[VoiceSessionRepository] Failed to save session to localStorage:', err);
    }
  }

  deleteSession(projectId: string, sessionId: string): void {
    try {
      const existing = this.getSessions(projectId);
      const filtered = existing.filter((s) => s.id !== sessionId);
      localStorage.setItem(this.getStorageKey(projectId), JSON.stringify(filtered));
    } catch (err) {
      console.warn('[VoiceSessionRepository] Failed to delete session from localStorage:', err);
    }
  }

  clearSessions(projectId: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(projectId));
    } catch (err) {
      console.warn('[VoiceSessionRepository] Failed to clear sessions from localStorage:', err);
    }
  }
}

export const voiceSessionRepository = new VoiceSessionRepository();
