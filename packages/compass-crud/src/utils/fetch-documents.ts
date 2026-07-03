import semver from 'semver';
import { isEmpty } from 'lodash';
import HadronDocument from 'hadron-document';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { DataService } from './data-service';
import type { BSONArray, BSONObject } from '../stores/insert';

export const fetchDocuments: (
  dataService: DataService,
  track: TrackFunction,
  serverVersion: string,
  isDataLake: boolean,
  ...args: Parameters<DataService['find']>
) => Promise<HadronDocument[]> = async (
  dataService: DataService,
  track: TrackFunction,
  serverVersion,
  isDataLake,
  ns,
  filter,
  options,
  executionOptions
) => {
  const canCalculateDocSize =
    // $bsonSize is only supported for mongodb >= 4.4.0
    semver.gte(serverVersion, '4.4.0') &&
    // ADF doesn't support $bsonSize
    !isDataLake &&
    // Accessing $$ROOT is not possible with CSFLE
    ['disabled', 'unavailable', undefined].includes(
      dataService?.getCSFLEMode?.()
    ) &&
    // User provided their own projection, we can handle this in some cases, but
    // it's hard to get right, so we will just skip this case
    isEmpty(options?.projection);

  const modifiedOptions = {
    ...options,
    projection: canCalculateDocSize
      ? { _id: 0, __doc: '$$ROOT', __size: { $bsonSize: '$$ROOT' } }
      : options?.projection,
  };

  try {
    let uuidSubtype3Count = 0;
    let uuidSubtype4Count = 0;
    const docs = (
      await dataService.find(ns, filter, modifiedOptions, executionOptions)
    ).map((doc) => {
      const { __doc, __size, ...rest } = doc;
      let hadronDoc: HadronDocument;
      if (__doc && __size && Object.keys(rest).length === 0) {
        hadronDoc = new HadronDocument(__doc);
        hadronDoc.size = Number(__size);
      } else {
        hadronDoc = new HadronDocument(doc);
      }
      const { subtype3Count, subtype4Count } = hadronDoc.findUUIDs();
      uuidSubtype3Count += subtype3Count;
      uuidSubtype4Count += subtype4Count;
      return hadronDoc;
    });
    if (uuidSubtype3Count > 0) {
      track('UUID Encountered', { subtype: 3, count: uuidSubtype3Count });
    }
    if (uuidSubtype4Count > 0) {
      track('UUID Encountered', { subtype: 4, count: uuidSubtype4Count });
    }
    return docs;
  } catch (err) {
    // We are handling all the cases where the size calculating projection might
    // not work, but just in case we run into some other environment or use-case
    // that we haven't anticipated, we will try re-running query without the
    // modified projection once more before failing again if this didn't work
    if (canCalculateDocSize && (err as Error).name === 'MongoServerError') {
      return (
        await dataService.find(ns, filter, options, executionOptions)
      ).map((doc) => {
        return new HadronDocument(doc);
      });
    }

    throw err;
  }
};

type ErrorOrResult =
  | [
      error: { message: string; code?: number; codeName?: string },
      result: undefined
    ]
  | [error: undefined | null, result: BSONObject];

export async function findAndModifyWithFLEFallback(
  ds: DataService,
  ns: string,
  query: BSONObject,
  object: { $set?: BSONObject; $unset?: BSONObject } | BSONObject | BSONArray,
  modificationType: 'update' | 'replace'
): Promise<ErrorOrResult> {
  const findOneAndModifyMethod =
    modificationType === 'update' ? 'findOneAndUpdate' : 'findOneAndReplace';
  let error: (Error & { codeName?: string; code?: any }) | undefined;

  try {
    return [
      undefined,
      await ds[findOneAndModifyMethod](ns, query, object, {
        returnDocument: 'after',
        promoteValues: false,
      }),
    ] as ErrorOrResult;
  } catch (e) {
    error = e as Error;
  }

  if (
    error.codeName === 'ShardKeyNotFound' ||
    +(error?.code ?? 0) === 63714_02 // 6371402 is "'findAndModify with encryption only supports new: false'"
  ) {
    const modifyOneMethod =
      modificationType === 'update' ? 'updateOne' : 'replaceOne';

    try {
      await ds[modifyOneMethod](ns, query, object);
    } catch (e) {
      // Return the modifyOneMethod error here
      // since we already know the original error from findOneAndModifyMethod
      // and want to know what went wrong with the fallback method,
      // e.g. return the `Found indexed encrypted fields but could not find __safeContent__` error.
      return [e, undefined] as ErrorOrResult;
    }

    try {
      const docs = await ds.find(
        ns,
        { _id: query._id as any },
        { promoteValues: false }
      );
      return [undefined, docs[0]] as ErrorOrResult;
    } catch {
      /* fallthrough */
    }
  }

  // Race condition -- most likely, somebody else
  // deleted the document between the findAndModify command
  // and the find command. Just return the original error.
  return [error, undefined] as ErrorOrResult;
}
