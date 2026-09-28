export { createLogger } from './ipc-logger';
export type { Logger } from './logger';
export { mongoLogId } from './provider';
import createDebug from 'debug';
export const debug = createDebug('mongodb-compass');
