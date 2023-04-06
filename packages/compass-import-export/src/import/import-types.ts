import type { Document } from 'bson';

import type {
  CollectionStreamStats,
  CollectionStreamProgressError,
} from '../utils/collection-stream';

export type ImportResult = {
  aborted?: boolean;
  dbErrors: CollectionStreamProgressError[];
  dbStats: CollectionStreamStats;
  docsWritten: number;
  docsProcessed: number;
};

export type ErrorJSON = {
  name: string;
  message: string;
  index?: number;
  code?: string | number;
  op?: any;
  errorInfo?: Document;
  /*
  e.index = index;
  e.code = code;
  e.op = op;
  e.errInfo = errInfo;
  // https://www.mongodb.com/docs/manual/reference/method/BulkWriteResult/#mongodb-data-BulkWriteResult.writeErrors
  e.name = index && op ? 'WriteError' : 'WriteConcernError';
*/
};

export type ImportProgress = {
  bytesProcessed: number;
  docsProcessed: number;
  docsWritten: number;
};
