import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { BSONObject } from '../stores/crud-store';
import type { DataService } from './data-service';

export async function countDocuments(
  dataService: DataService,
  preferences: PreferencesAccess,
  ns: string,
  filter: BSONObject | undefined,
  {
    signal,
    skip,
    limit,
    maxTimeMS,
    hint,
  }: { signal: AbortSignal; skip?: number; limit?: number } & Parameters<
    typeof dataService.aggregate
  >[2],
  onSkippedError: (err: any) => void = () => {
    // noop
  }
): Promise<number | null> {
  const opts = {
    maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, maxTimeMS),
    hint,
  };

  let $match: BSONObject;
  if (filter && Object.keys(filter).length > 0) {
    // not all find filters are valid $match stages..
    $match = filter;
  } else {
    $match = {};
  }

  const stages: BSONObject[] = [{ $match }];
  if (skip) {
    stages.push({ $skip: skip });
  }
  if (limit) {
    stages.push({ $limit: limit });
  }
  stages.push({ $count: 'count' });

  let result;
  try {
    const array = await dataService.aggregate(ns, stages, opts, {
      abortSignal: signal,
    });
    // the collection could be empty
    result = array.length ? array[0].count : 0;
  } catch (err: any) {
    // rethrow if we aborted along the way
    if (dataService.isCancelError(err)) {
      throw err;
    }

    // for all other errors we assume the query failed
    onSkippedError(err);
    // The count queries can frequently time out on large collections.
    // The UI will just have to deal with null.
    result = null;
  }
  return result;
}

export async function fetchShardingKeys(
  dataService: DataService,
  ns: string,
  {
    signal,
    maxTimeMS,
  }: {
    signal: AbortSignal;
  } & Parameters<typeof dataService.find>[2],
  onSkippedError: (err: any) => void = () => {
    // noop
  }
): Promise<BSONObject> {
  try {
    const docs = await dataService.find(
      'config.collections',
      {
        _id: ns as any,
        // unsplittable introduced in SPM-3364 to mark unsharded collections
        // that are still being tracked in the catalog
        unsplittable: { $ne: true },
      },
      { maxTimeMS, projection: { key: 1, _id: 0 } },
      { abortSignal: signal }
    );
    return docs.length ? docs[0].key : {};
  } catch (err: any) {
    // rethrow if we aborted along the way
    if (dataService.isCancelError(err)) {
      throw err;
    }

    // for other errors assume that the query failed
    onSkippedError(err);
  }

  return {};
}
