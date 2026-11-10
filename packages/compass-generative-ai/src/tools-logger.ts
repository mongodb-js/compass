import type { Logger } from '@mongodb-js/compass-logging';
import type { Keychain } from '@mongodb-js/mcp-core';
import { RedactingLoggerBase } from '@mongodb-js/mcp-core';
import type { LoggerType, LogLevel, LogPayload } from '@mongodb-js/mcp-types';

export class ToolsLogger extends RedactingLoggerBase {
  private readonly _logger: Logger;
  protected readonly type: LoggerType = 'console';

  constructor(keychain: Keychain, logger: Logger) {
    super({ keychain });
    this._logger = logger;
  }

  protected logCore(level: LogLevel, payload: LogPayload): void {
    const logMethod = this.mapToMongoDBLogLevel(level);

    this._logger.log[logMethod](
      this._logger.mongoLogId(1_001_000_400),
      'Compass Database Tools',
      `${payload.id.__value} - ${payload.context}: ${payload.message}`,
      ...(payload.attributes ? [payload.attributes] : [])
    );
  }

  protected mapToMongoDBLogLevel(
    level: LogLevel
  ): 'debug' | 'info' | 'warn' | 'error' {
    switch (level) {
      case 'debug':
        return 'debug';
      case 'info':
        return 'info';
      case 'warning':
        return 'warn';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }
}
