import type { Signal } from '@mongodb-js/compass-components';
import { PerformanceSignals } from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { Element } from 'hadron-document';

export { countDocuments, fetchShardingKeys } from './cancellable-queries';

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
