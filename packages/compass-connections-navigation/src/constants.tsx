import { spacing } from '@mongodb-js/compass-components';

// TODO: Currently we show placeholder for every collection/database item in the list, but
// do we want to / need to?
export const MAX_COLLECTION_PLACEHOLDER_ITEMS = Infinity;
export const MAX_DATABASE_PLACEHOLDER_ITEMS = Infinity;
export const ROW_HEIGHT = spacing[5];
// export const COLLETIONS_MARGIN_BOTTOM = spacing[1];

export type Actions =
  | 'connection-options'
  | 'select-connection'
  | 'select-database'
  | 'drop-database'
  | 'select-collection'
  | 'create-collection'
  | 'drop-collection'
  | 'open-in-new-tab'
  | 'duplicate-view'
  | 'modify-view'
  | 'rename-collection';
