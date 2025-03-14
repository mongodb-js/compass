import type { Document } from 'bson';

import type { DataService } from 'mongodb-data-service';
import type { Writable } from 'stream';

export type ImportOptions = {
  dataService: Pick<DataService, 'bulkWrite' | 'insertOne'>;
  ns: string;
  output?: Writable;
  abortSignal?: AbortSignal;
  progressCallback?: (progress: ImportProgress) => void;
  errorCallback?: (error: ErrorJSON) => void;
  stopOnErrors?: boolean;
};

export type ImportResult = {
  aborted?: boolean;
  docsWritten: number;
  docsProcessed: number;
  docsErrored: number;
  biggestDocSize: number;
  hasUnboundArray: boolean;
};

export type ErrorJSON = {
  name: string;
  message: string;
  index?: number;
  code?: string | number;
  op?: any;
  errInfo?: Document;
  numErrors?: number;
};

export type ImportProgress = {
  bytesProcessed: number;
  docsProcessed: number;
  docsWritten: number;
};
