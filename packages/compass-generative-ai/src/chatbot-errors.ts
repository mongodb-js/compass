import { AtlasServiceError } from '@mongodb-js/atlas-service/renderer';

export class AiChatbotInvalidResponseError extends AtlasServiceError {
  constructor(message: string) {
    super('ServerError', 500, message, 'INVALID_RESPONSE');
    this.name = 'AiChatbotInvalidResponseError';
  }
}

export class AiChatbotPromptTooLargeError extends AtlasServiceError {
  constructor(message: string) {
    super('NetworkError', 400, message, 'PROMPT_TOO_LARGE');
    this.name = 'AiChatbotPromptTooLargeError';
  }
}
