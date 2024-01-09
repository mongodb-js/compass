import type { AggregateOptions, Document } from 'mongodb';
import type { PreferencesAccess } from 'compass-preferences-model';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { DataService } from '../modules/data-service';

const defaultOptions = {
  promoteValues: false,
  allowDiskUse: true,
  bsonRegExp: true,
};

export async function aggregatePipeline({
  dataService,
  preferences,
  signal,
  namespace,
  pipeline,
  options,
  skip,
  limit,
}: {
  dataService: DataService;
  preferences: PreferencesAccess;
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
    maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, options.maxTimeMS),
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
