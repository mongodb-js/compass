import type { AggregateOptions, Document, Sort } from 'mongodb';

export type ExportAggregation = {
  stages: Document[];
  options?: AggregateOptions;
};

export type ExportQuery = {
  filter: Document;
  sort?: Sort;
  limit?: number;
  skip?: number;
  projection?: Document;
};

export type ExportResult = {
  docsWritten: number;
  aborted: boolean;
};
