export { createLoggerAndTelemetry } from './ipc-logger';
export type { LoggerAndTelemetry } from './logger';
export { mongoLogId } from 'mongodb-log-writer';
import createDebug from 'debug';
export const debug = createDebug('mongodb-compass');
