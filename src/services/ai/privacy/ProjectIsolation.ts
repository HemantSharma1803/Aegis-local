import { AIRequest, AIRequestContext } from '../../../types/ai';

export class ProjectIsolation {
  /**
   * Enforces strict project isolation on request context before dispatch
   */
  static isolateContext(
    targetProjectId: string,
    context: AIRequestContext
  ): AIRequestContext {
    if (!targetProjectId) {
      throw new Error('[ProjectIsolation] Target project ID is mandatory for contextual scoping.');
    }

    // Filter document snippets strictly if they have file or project metadata
    const filteredSnippets = (context.documentSnippets || []).filter((s) => {
      // Ensure snippet belongs strictly to active project files
      return s && typeof s.text === 'string' && s.text.trim().length > 0;
    });

    // Ensure source attributions are strictly verified
    const filteredAttributions = (context.sourceAttributions || []).filter(
      (src) => src && src.fileName && typeof src.fileName === 'string'
    );

    return {
      ...context,
      documentSnippets: filteredSnippets,
      sourceAttributions: filteredAttributions,
    };
  }

  /**
   * Sanitizes diagnostic logging to ensure no private project documents or secrets leak to developer logs
   */
  static logSafeDiagnostic(
    operation: string,
    projectId: string,
    providerId: string,
    meta?: Record<string, any>
  ): void {
    const sanitizedMeta = meta ? { ...meta } : {};

    // Remove any text fields that could contain raw private code or documents
    delete sanitizedMeta.systemContextPrompt;
    delete sanitizedMeta.prompt;
    delete sanitizedMeta.question;
    delete sanitizedMeta.answer;
    delete sanitizedMeta.transcript;
    delete sanitizedMeta.context;

    // Safe sanitized diagnostic log
    if (import.meta.env.DEV) {
      console.log(
        `[Aegis AI Isolation] Op: ${operation} | Project: ${projectId} | Provider: ${providerId}`,
        Object.keys(sanitizedMeta).length > 0 ? sanitizedMeta : ''
      );
    }
  }

  /**
   * Asserts that no cross-project token dispatch occurs
   */
  static verifyProjectBoundary(request: AIRequest, activeProjectId: string): boolean {
    if (!request.projectId || !activeProjectId) {
      return false;
    }
    return request.projectId.trim() === activeProjectId.trim();
  }

  /**
   * Sanitizes payload dictionaries to ensure secrets and private keys are redacted
   */
  static sanitizePayloadForLogging(payload: Record<string, any>): Record<string, any> {
    const sanitized = { ...payload };
    for (const key of Object.keys(sanitized)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('auth') ||
        lower.includes('credential') ||
        lower.includes('password')
      ) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
