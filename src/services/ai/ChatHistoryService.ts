import { ChatMessage } from '../../types/ai';

const CHAT_STORAGE_PREFIX = 'aegis_local_chat_history_';

export class ChatHistoryService {
  private getKey(projectId: string): string {
    return `${CHAT_STORAGE_PREFIX}${projectId}`;
  }

  getMessages(projectId: string): ChatMessage[] {
    try {
      const raw = localStorage.getItem(this.getKey(projectId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[ChatHistoryService] Failed to load messages:', err);
      return [];
    }
  }

  saveMessages(projectId: string, messages: ChatMessage[]): void {
    try {
      localStorage.setItem(this.getKey(projectId), JSON.stringify(messages));
    } catch (err) {
      console.error('[ChatHistoryService] Failed to save messages:', err);
    }
  }

  clearHistory(projectId: string): void {
    try {
      localStorage.removeItem(this.getKey(projectId));
    } catch (err) {
      console.error('[ChatHistoryService] Failed to clear history:', err);
    }
  }
}

export const chatHistoryService = new ChatHistoryService();
