import { useEffect } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../modules';
import { isSearchStage } from '../utils/stage';
import {
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
} from '../modules/search-indexes';
import { getPipelineStageOperatorsFromBuilderState } from '../modules/pipeline-builder/builder-helpers';
import { VIEW_PIPELINE_UTILS, ATLAS } from '@mongodb-js/mongodb-constants';

type SearchIndexesPollingControllerProps = {
  hasSearchStage: boolean;
  isSearchIndexesSupported: boolean;
  startPollingSearchIndexes: () => void;
  stopPollingSearchIndexes: () => void;
};

/**
 * A component that manages search indexes polling based on pipeline content.
 *
 * When a search stage ($search, $searchMeta, $vectorSearch) is in the pipeline,
 * this component will start polling for search index updates.
 * When there are no search stages, polling is stopped.
 */
export function SearchIndexesPollingController({
  hasSearchStage,
  isSearchIndexesSupported,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
}: SearchIndexesPollingControllerProps): null {
  useEffect(() => {
    if (!isSearchIndexesSupported) {
      return;
    }

    if (hasSearchStage) {
      startPollingSearchIndexes();
    } else {
      stopPollingSearchIndexes();
    }
  }, [
    hasSearchStage,
    isSearchIndexesSupported,
    startPollingSearchIndexes,
    stopPollingSearchIndexes,
  ]);

  return null;
}

export default connect(
  (state: RootState) => {
    const operators = getPipelineStageOperatorsFromBuilderState(state, false);
    const hasSearchStage = operators.some((op) => isSearchStage(op));

    const isReadonlyView = !!state.sourceName;
    const isAtlas = state.env === ATLAS;
    const isViewVersionSearchCompatible = isAtlas
      ? VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsDataExplorer(
          state.serverVersion
        )
      : VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
          state.serverVersion
        );
    const isSearchIndexesSupported = isReadonlyView
      ? isViewVersionSearchCompatible
      : state.searchIndexes.isSearchIndexesSupported;

    return {
      hasSearchStage,
      isSearchIndexesSupported,
    };
  },
  {
    startPollingSearchIndexes,
    stopPollingSearchIndexes,
  }
)(SearchIndexesPollingController);
