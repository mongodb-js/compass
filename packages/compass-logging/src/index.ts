import createDebug from 'debug';

export { createLogger } from './ipc-logger';
export { createGenericLogger } from './logger';
export type { Logger } from './logger';
export { mongoLogId } from 'mongodb-log-writer/mongo-log-writer';
export const debug = createDebug('mongodb-compass');
