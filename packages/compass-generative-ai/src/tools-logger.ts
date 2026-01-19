import type { Logger } from '@mongodb-js/compass-logging';
import type { LoggerType, LogLevel, LogPayload } from 'mongodb-mcp-server';
import { LoggerBase } from 'mongodb-mcp-server';
import type { Keychain } from 'mongodb-mcp-server';

export class ToolsLogger extends LoggerBase {
  private readonly _logger: Logger;
  protected type: LoggerType = 'console';

  constructor(keychain: Keychain, logger: Logger) {
    super(keychain);
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
