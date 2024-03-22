import { spacing } from '@mongodb-js/compass-components';

// TODO: Currently we show placeholder for every collection item in the list, but
// do we want to / need to?
export const MAX_COLLECTION_PLACEHOLDER_ITEMS = Infinity;
export const DATABASE_ROW_HEIGHT = spacing[5];
// export const COLLECTION_ROW_HEIGHT = spacing[4] + spacing[1];
// TODO: Discuss with claudia, but this should make our lives much easier as
// without this we need to manually trigger recalc/rerender on all the items in
// the list on expand/collapse and the difference in size is not that noticeable
export const COLLECTION_ROW_HEIGHT = DATABASE_ROW_HEIGHT;
// export const COLLETIONS_MARGIN_BOTTOM = spacing[1];

export type Actions =
  | 'select-database'
  | 'drop-database'
  | 'select-collection'
  | 'create-collection'
  | 'drop-collection'
  | 'open-in-new-tab'
  | 'duplicate-view'
  | 'modify-view'
  | 'rename-collection';
