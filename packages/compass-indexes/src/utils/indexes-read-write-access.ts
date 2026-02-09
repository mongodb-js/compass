import { useSelector } from 'react-redux';
import { usePreferences } from 'compass-preferences-model/provider';
import type { RootState } from '../modules';
import { useIsViewSearchCompatible } from './is-view-search-compatible';

export function useReadWriteAccess(): {
  isRegularIndexesReadable: boolean;
  isRegularIndexesWritable: boolean;
  isSearchIndexesReadable: boolean;
  isSearchIndexesWritable: boolean;
} {
  const { isWritable, isReadonlyView, isSearchIndexesSupported } = useSelector(
    (state: RootState) => ({
      serverVersion: state.serverVersion,
      isWritable: state.isWritable,
      isReadonlyView: state.isReadonlyView,
      isSearchIndexesSupported: state.isSearchIndexesSupported,
      collectionStats: state.collectionStats,
    })
  );

  const { readWrite, readOnly, enableAtlasSearchIndexes } = usePreferences([
    'readWrite',
    'readOnly',
    'enableAtlasSearchIndexes',
  ]);

  const { isViewVersionSearchCompatible, isViewPipelineSearchQueryable } =
    useIsViewSearchCompatible();

  const isRegularIndexesReadable = getIsRegularIndexesReadable(isReadonlyView);
  const isRegularIndexesWritable =
    isRegularIndexesReadable && !readOnly && !readWrite && isWritable;

  // there is a case where a view was initially search queryable but then the view gets updated to be not search queryable
  // in this case the view should still be search indexes readable (but not writable)
  const isSearchIndexesReadable = getIsSearchIndexesReadable(
    enableAtlasSearchIndexes,
    isReadonlyView,
    isViewVersionSearchCompatible,
    isSearchIndexesSupported
  );
  const isSearchIndexesWritable =
    isSearchIndexesReadable &&
    !readOnly &&
    !readWrite &&
    isWritable &&
    (isReadonlyView
      ? isViewVersionSearchCompatible && isViewPipelineSearchQueryable
      : true);

  return {
    isRegularIndexesReadable,
    isRegularIndexesWritable,
    isSearchIndexesReadable,
    isSearchIndexesWritable,
  };
}

export function getIsRegularIndexesReadable(isReadonlyView: boolean): boolean {
  return !isReadonlyView;
}

export function getIsSearchIndexesReadable(
  enableAtlasSearchIndexes: boolean,
  isReadonlyView: boolean,
  isViewVersionSearchCompatible: boolean,
  isSearchIndexesSupported: boolean
): boolean {
  return (
    enableAtlasSearchIndexes &&
    (isReadonlyView ? isViewVersionSearchCompatible : isSearchIndexesSupported)
  );
}
