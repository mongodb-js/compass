import {
  PerformanceSignals,
  type Signal,
} from '@mongodb-js/compass-components';

export const getToolbarSignal = ({
  query,
  isCollectionScan,
  isSearchIndexesSupported,
  canCreateIndexes,
  onCreateIndex,
  onCreateSearchIndex,
  onAssistantButtonClick,
}: {
  query: string;
  isCollectionScan: boolean;
  isSearchIndexesSupported: boolean;
  canCreateIndexes: boolean;
  onCreateIndex: () => void;
  onCreateSearchIndex: () => void;
  onAssistantButtonClick?: () => void;
}): Signal | undefined => {
  if (!isCollectionScan) {
    return undefined;
  }
  if (/\$(text|regex)\b/.test(query) && isSearchIndexesSupported) {
    return {
      ...PerformanceSignals.get('atlas-text-regex-usage-in-query'),
      ...(canCreateIndexes
        ? { onPrimaryActionButtonClick: onCreateSearchIndex }
        : { primaryActionButtonLabel: undefined }),
    };
  }
  return {
    ...PerformanceSignals.get('query-executed-without-index'),
    ...(canCreateIndexes
      ? { onPrimaryActionButtonClick: onCreateIndex }
      : { primaryActionButtonLabel: undefined }),
    onAssistantButtonClick,
  };
};
