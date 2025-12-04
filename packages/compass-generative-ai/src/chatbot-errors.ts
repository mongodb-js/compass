export class AiChatbotError extends Error {
  statusCode: number;
  errorCode: string;
  detail: string;

  constructor(statusCode: number, detail: string, errorCode: string) {
    super(`${errorCode}: ${detail}`);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.detail = detail;
  }
}

export class AiChatbotInvalidResponseError extends AiChatbotError {
  constructor(message: string) {
    super(500, message, 'INVALID_RESPONSE');
    this.name = 'AiChatbotInvalidResponseError';
  }
}
