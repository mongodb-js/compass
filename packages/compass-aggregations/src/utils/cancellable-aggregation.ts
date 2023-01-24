import type { AggregateOptions, Document } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';

const defaultOptions = {
  promoteValues: false,
  allowDiskUse: true,
  bsonRegExp: true,
};

export async function aggregatePipeline({
  dataService,
  signal,
  namespace,
  pipeline,
  options,
  skip,
  limit,
}: {
  dataService: DataService;
  signal: AbortSignal;
  namespace: string;
  pipeline: Document[];
  options: AggregateOptions;
  skip?: number;
  limit?: number;
}): Promise<Document[]> {
  const allOptions = {
    ...defaultOptions,
    ...options,
    maxTimeMS: capMaxTimeMSAtPreferenceLimit(options.maxTimeMS),
  };
  return dataService.aggregate(
    namespace,
    pipeline
      .concat(skip ? [{ $skip: skip }] : [])
      .concat(limit ? [{ $limit: limit }] : []),
    allOptions,
    {
      abortSignal: signal,
    }
  );
}
