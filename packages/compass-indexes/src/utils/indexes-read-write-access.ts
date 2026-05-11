import type { RootState } from '../modules';
import { selectIsViewSearchCompatible } from './is-view-search-compatible';

/**
 * Selector function that returns read/write access information for indexes.
 * @param params - Parameters from usePreferences
 * @returns A selector function that can be used with useSelector
 */
export function selectReadWriteAccess({
  readOnly,
  readWrite,
  enableAtlasSearchIndexes,
  enableSearchActivationProgramP1,
}: {
  readOnly: boolean;
  readWrite: boolean;
  enableAtlasSearchIndexes: boolean;
  enableSearchActivationProgramP1: boolean;
}) {
  return (
    state: RootState
  ): {
    isRegularIndexesReadable: boolean;
    isRegularIndexesWritable: boolean;
    isSearchIndexesReadable: boolean;
    isSearchIndexesWritable: boolean;
  } => {
    const { isWritable, isReadonlyView, isSearchIndexesSupported } = state;

    const { isViewVersionSearchCompatible, isViewPipelineSearchQueryable } =
      selectIsViewSearchCompatible(state);

    const isRegularIndexesReadable = !isReadonlyView;
    const isRegularIndexesWritable =
      isRegularIndexesReadable && !readOnly && !readWrite && isWritable;

    // there is a case where a view was initially search queryable but then the view gets updated to be not search queryable
    // in this case the view should still be search indexes readable (but not writable)
    const isSearchIndexesReadable =
      (enableAtlasSearchIndexes || enableSearchActivationProgramP1) &&
      (isReadonlyView
        ? isViewVersionSearchCompatible
        : isSearchIndexesSupported);
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
  };
}
