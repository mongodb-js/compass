import { spacing } from '@mongodb-js/compass-components';

// TODO: Currently we show placeholder for every collection/database item in the list, but
// do we want to / need to?
export const MAX_COLLECTION_PLACEHOLDER_ITEMS = Infinity;
export const MAX_DATABASE_PLACEHOLDER_ITEMS = Infinity;
export const MIN_DATABASE_PLACEHOLDER_ITEMS = 5;
export const ROW_HEIGHT = spacing[5];
// export const COLLETIONS_MARGIN_BOTTOM = spacing[1];

export type Actions =
  | 'open-shell'
  | 'connection-performance-metrics'
  | 'open-connection-info'
  | 'copy-connection-string'
  | 'connection-toggle-favorite'
  | 'connection-disconnect'
  | 'select-connection'
  | 'select-database'
  | 'create-database'
  | 'drop-database'
  | 'select-collection'
  | 'create-collection'
  | 'drop-collection'
  | 'open-in-new-tab'
  | 'duplicate-view'
  | 'modify-view'
  | 'rename-collection';
