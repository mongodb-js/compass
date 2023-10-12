import {
  PerformanceSignals,
  type Signal,
} from '@mongodb-js/compass-components';

export const getToolbarSignal = (
  query: string,
  isCollectionScan: boolean,
  isSearchIndexesSupported: boolean,
  onCreateIndex: () => void,
  onCreateSearchIndex: () => void
): Signal | undefined => {
  if (!isCollectionScan) {
    return undefined;
  }
  if (/\$(text|regex)\b/.test(query) && isSearchIndexesSupported) {
    return {
      ...PerformanceSignals.get('atlas-text-regex-usage-in-query'),
      onPrimaryActionButtonClick: onCreateSearchIndex,
    };
  }
  return {
    ...PerformanceSignals.get('query-executed-without-index'),
    onPrimaryActionButtonClick: onCreateIndex,
  };
};
