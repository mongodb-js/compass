/**
 * The plugin database name.
 */
export const INDEXED_DB = 'compass-aggregations';

/**
 * The collection name.
 */
export const PIPELINES = 'pipelines';

/**
 * Upgrade the db.
 *
 * @param {IDBDatabase} db - The database.
 */
const upgradeDb = (db) => {
  const store = db.createObjectStore(PIPELINES);
  store.createIndex('namespace', 'namespace', { unique: false });
};

/**
 * Get the object store for the provided mode.
 *
 * @param {String} mode - The mode.
 * @param {Function} done - The callback.
 */
export const getObjectStore = (mode, done) => {
  const request = window.indexedDB.open(INDEXED_DB, 1);
  request.onsuccess = (evt) => {
    const db = evt.target.result;
    const transaction = db.transaction(PIPELINES, mode);
    done(transaction.objectStore(PIPELINES));
  };

  request.onupgradeneeded = (evt) => {
    upgradeDb(evt.target.result);
  };
};
