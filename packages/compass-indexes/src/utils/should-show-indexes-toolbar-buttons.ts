import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';

/**
 * Returns true when the indexes toolbar action buttons (create index, refresh,
 * segmented control, etc.) should be shown.
 */
export function shouldShowIndexesToolbarButtons({
  isReadonlyView,
  serverVersion,
  isSearchManagementActive,
  isViewPipelineSearchQueryable,
  hasSearchIndexes,
}: {
  isReadonlyView: boolean;
  serverVersion: string;
  isSearchManagementActive: boolean;
  isViewPipelineSearchQueryable: boolean;
  hasSearchIndexes: boolean;
}): boolean {
  // Non-views always show the toolbar.
  if (!isReadonlyView) {
    return true;
  }

  // Views need 8.1+ and search management enabled.
  if (
    !VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
      serverVersion
    ) ||
    !isSearchManagementActive
  ) {
    return false;
  }

  // Search-queryable views, or incompatible views that still have existing
  // indexes show toolbar.
  return isViewPipelineSearchQueryable || hasSearchIndexes;
}
