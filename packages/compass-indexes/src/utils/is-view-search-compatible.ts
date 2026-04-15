import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';
import type { RootState } from '../modules';
import type { Document } from 'mongodb';

/**
 * Selector that returns view search compatibility information.
 */
export function selectIsViewSearchCompatible(state: RootState): {
  isViewVersionSearchCompatible: boolean;
  isViewPipelineSearchQueryable: boolean;
} {
  const { serverVersion, collectionStats } = state;

  const isViewVersionSearchCompatible =
    VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(serverVersion);
  const isViewPipelineSearchQueryable = collectionStats?.pipeline
    ? VIEW_PIPELINE_UTILS.isPipelineSearchQueryable(
        collectionStats?.pipeline as Document[]
      )
    : true;

  return {
    isViewVersionSearchCompatible,
    isViewPipelineSearchQueryable,
  };
}
