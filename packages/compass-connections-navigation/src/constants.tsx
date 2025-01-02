// TODO: Currently we show placeholder for every collection/database item in the list, but
// do we want to / need to?
export const MAX_COLLECTION_PLACEHOLDER_ITEMS = Infinity;
export const MAX_DATABASE_PLACEHOLDER_ITEMS = Infinity;
export const MIN_DATABASE_PLACEHOLDER_ITEMS = 5;
export const ROW_HEIGHT = 28;

export type Actions =
  // Atlas Cloud actions
  | 'show-connect-via-modal'
  // connection item related actions
  | 'open-shell'
  | 'select-connection'
  | 'edit-connection'
  | 'duplicate-connection'
  | 'remove-connection'
  | 'connection-connect'
  | 'connection-connect-in-new-window'
  | 'connection-disconnect'
  | 'connection-performance-metrics'
  | 'open-connection-info'
  | 'copy-connection-string'
  | 'connection-toggle-favorite'
  | 'open-non-genuine-mongodb-modal'
  | 'open-csfle-modal'
  | 'refresh-databases'
  // database item related actions
  | 'select-database'
  | 'create-database'
  | 'drop-database'
  // collection item related action
  | 'select-collection'
  | 'create-collection'
  | 'drop-collection'
  | 'open-in-new-tab'
  | 'duplicate-view'
  | 'modify-view'
  | 'rename-collection';
