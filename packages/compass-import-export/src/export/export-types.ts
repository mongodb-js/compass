import type {
  AggregateOptions,
  Document,
  Sort,
  CollationOptions,
} from 'mongodb';

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
  collation?: CollationOptions;
};

export type ExportResult = {
  docsWritten: number;
  aborted: boolean;
};
