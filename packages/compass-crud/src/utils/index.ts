import type { Signal } from '@mongodb-js/compass-components';
import { PerformanceSignals } from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { Element } from 'hadron-document';
import HadronDocument from 'hadron-document';
import semver from 'semver';
import { isEmpty } from 'lodash';
import type { DataService } from './data-service';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

export { countDocuments, fetchShardingKeys } from './cancellable-queries';

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

/**
 * Get the size for the string value.
 * Returns 1 with an empty string.
 *
 * @param {Object} value - The value.
 *
 * @return {Number} The size.
 */
export const fieldStringLen = (value: unknown) => {
  const length = String(value).length;
  return length === 0 ? 1 : length;
};

export function shouldShowUnboundArrayInsight(
  el: Document | Element,
  thresholdLength = 250
) {
  if (el.isRoot() || el.currentType === 'Object') {
    for (const child of el.elements ?? []) {
      if (shouldShowUnboundArrayInsight(child, thresholdLength)) {
        return true;
      }
    }
    return false;
  }
  if (el.currentType === 'Array') {
    return (
      el.elements &&
      el.elements.size >= thresholdLength &&
      el.elements.some((el) => {
        return ['Object', 'Document', 'ObjectId', 'String'].includes(
          el.currentType
        );
      })
    );
  }
  return false;
}

export function getInsightsForDocument(
  doc?: Document | null
): Signal[] | undefined {
  if (!doc) {
    return;
  }

  const insights = [];

  if ((doc.size ?? 0) > 10_000_000) {
    insights.push(PerformanceSignals.get('bloated-document'));
  }

  if (shouldShowUnboundArrayInsight(doc)) {
    insights.push(PerformanceSignals.get('unbound-array'));
  }

  return insights.length > 0 ? insights : undefined;
}

export function objectContainsRegularExpression(obj: unknown): boolean {
  // This assumes that the input is not circular.
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  if (Object.prototype.toString.call(obj) === '[object RegExp]') {
    return true;
  }
  return Object.values(obj).some(objectContainsRegularExpression);
}
