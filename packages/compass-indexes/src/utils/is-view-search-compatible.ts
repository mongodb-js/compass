import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';
import type { RootState } from '../modules';
import type { Document } from 'mongodb';

/**
 * Selector function that returns view search compatibility information.
 * @param isAtlas - Whether the connection is to Atlas (from useConnectionInfo)
 * returns A selector function that can be used with useSelector
 */
export function selectIsViewSearchCompatible(isAtlas: boolean) {
  return (
    state: RootState
  ): {
    isViewVersionSearchCompatible: boolean;
    isViewPipelineSearchQueryable: boolean;
  } => {
    const { serverVersion, collectionStats } = state;

    const isViewVersionSearchCompatible = isAtlas
      ? VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsDataExplorer(
          serverVersion
        )
      : VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
          serverVersion
        );
    const isViewPipelineSearchQueryable = collectionStats?.pipeline
      ? VIEW_PIPELINE_UTILS.isPipelineSearchQueryable(
          collectionStats?.pipeline as Document[]
        )
      : true;

    return {
      isViewVersionSearchCompatible,
      isViewPipelineSearchQueryable,
    };
  };
}
