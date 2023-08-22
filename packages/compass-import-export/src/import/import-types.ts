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
  biggestDocSize: number;
  hasUnboundArray: boolean;
};

export type ErrorJSON = {
  name: string;
  message: string;
  index?: number;
  code?: string | number;
  op?: any;
  errorInfo?: Document;
};

export type ImportProgress = {
  bytesProcessed: number;
  docsProcessed: number;
  docsWritten: number;
};
