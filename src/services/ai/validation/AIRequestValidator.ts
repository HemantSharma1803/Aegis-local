import { AIRequest, AIOperation } from '../../../types/ai';

export interface RequestValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedRequest?: AIRequest;
}

export class AIRequestValidator {
  private static readonly ALLOWED_OPERATIONS: AIOperation[] = [
    'ask',
    'prepare',
    'judge',
    'voice-analysis',
    'summarize',
    'extract',
    'classify',
  ];

  /**
   * Validates an outgoing AIRequest before dispatching to any provider
   */
  static validate(request: AIRequest): RequestValidationResult {
    const errors: string[] = [];

    if (!request || typeof request !== 'object') {
      return { valid: false, errors: ['Request payload must be a non-null object'] };
    }

    if (!request.projectId || typeof request.projectId !== 'string' || !request.projectId.trim()) {
      errors.push('Missing or empty projectId');
    }

    if (request.operation && !this.ALLOWED_OPERATIONS.includes(request.operation)) {
      errors.push(`Unsupported AI operation: "${request.operation}"`);
    }

    if (!request.context || typeof request.context !== 'object') {
      errors.push('Missing request context');
    }

    // Question / prompt checks for operations that require user text
    const textQuery = request.question || request.prompt;
    if (request.operation === 'ask' && (!textQuery || !textQuery.trim())) {
      errors.push('Operation "ask" requires a non-empty question or prompt string');
    }

    // Temperature bounds
    let sanitizedTemperature = request.temperature;
    if (sanitizedTemperature !== undefined) {
      if (typeof sanitizedTemperature !== 'number' || isNaN(sanitizedTemperature)) {
        errors.push('Temperature must be a valid number');
      } else {
        sanitizedTemperature = Math.max(0, Math.min(2.0, sanitizedTemperature));
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const sanitizedRequest: AIRequest = {
      ...request,
      projectId: request.projectId.trim(),
      projectName: request.projectName?.trim() || 'Untitled Project',
      question: request.question?.trim(),
      prompt: request.prompt?.trim() || request.question?.trim(),
      temperature: sanitizedTemperature ?? 0.2,
      context: {
        ...request.context,
        systemContextPrompt: request.context.systemContextPrompt || '',
        sourceAttributions: Array.isArray(request.context.sourceAttributions)
          ? request.context.sourceAttributions
          : [],
      },
    };

    return { valid: true, errors: [], sanitizedRequest };
  }
}
