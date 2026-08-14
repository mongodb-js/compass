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
  enableIndexesManagement,
}: {
  readOnly: boolean;
  readWrite: boolean;
  enableAtlasSearchIndexes: boolean;
  enableSearchActivationProgramP1: boolean;
  enableIndexesManagement: boolean;
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
    // `enableIndexesManagement` allows creating / dropping / hiding indexes even
    // when the user lacks general write access (`readOnly`) or admin-level
    // access (`readWrite`). This matches the Atlas "Index Manager" role, where
    // MongoDB itself authorizes `createIndex` / `dropIndex` for these users.
    const canManageIndexes =
      enableIndexesManagement || (!readOnly && !readWrite);
    const isRegularIndexesWritable =
      isRegularIndexesReadable && canManageIndexes && isWritable;

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
