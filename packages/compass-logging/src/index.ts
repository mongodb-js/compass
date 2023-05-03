export { createLoggerAndTelemetry } from './logger';
export { createLoggerAndTelemetry as default } from './logger';
export type { LoggerAndTelemetry } from './logger';
export {
  useLoggerAndTelemetry,
  useTrackOnChange,
  withLoggerAndTelemetry,
} from './react';
export { mongoLogId } from 'mongodb-log-writer';
import createDebug from 'debug';
export const debug = createDebug('mongodb-compass');
