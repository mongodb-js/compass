export { createLogger } from './ipc-logger';
export type { Logger } from './logger';
export { mongoLogId } from 'mongodb-log-writer/mongo-log-writer';
import createDebug from 'debug';
export const debug = createDebug('mongodb-compass');
