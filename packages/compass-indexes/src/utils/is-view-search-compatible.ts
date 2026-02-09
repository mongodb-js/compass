import { useSelector } from 'react-redux';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';
import type { RootState } from '../modules';
import type { Document } from 'mongodb';

export function useIsViewSearchCompatible(): {
  isViewVersionSearchCompatible: boolean;
  isViewPipelineSearchQueryable: boolean;
} {
  const { serverVersion, collectionStats } = useSelector(
    (state: RootState) => ({
      serverVersion: state.serverVersion,
      collectionStats: state.collectionStats,
    })
  );

  const { atlasMetadata } = useConnectionInfo();
  const isAtlas = !!atlasMetadata;

  const isViewVersionSearchCompatible = getIsViewVersionSearchCompatible(
    serverVersion,
    isAtlas
  );
  const isViewPipelineSearchQueryable = getIsViewPipelineSearchQueryable(
    collectionStats?.pipeline as Document[]
  );

  return {
    isViewVersionSearchCompatible,
    isViewPipelineSearchQueryable,
  };
}

export function getIsViewVersionSearchCompatible(
  serverVersion: string,
  isAtlas: boolean
): boolean {
  return isAtlas
    ? VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsDataExplorer(
        serverVersion
      )
    : VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
        serverVersion
      );
}

export function getIsViewPipelineSearchQueryable(
  pipeline?: Document[]
): boolean {
  return pipeline
    ? VIEW_PIPELINE_UTILS.isPipelineSearchQueryable(pipeline)
    : true;
}
