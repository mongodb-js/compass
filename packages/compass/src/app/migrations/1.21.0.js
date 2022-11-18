const debug = require('debug')('mongodb-compass:migrations');
const asyncr = require('async');
const fs = require('fs');
const path = require('path');
const remote = require('@electron/remote');

/**
 * The plugin database name.
 */
const INDEXED_DB = 'compass-aggregations';

/**
 * The collection name.
 */
const PIPELINES = 'pipelines';

/**
 * Saved pipelines on disk.
 */
const FS_DIR = 'SavedPipelines';

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
const getObjectStore = (mode, done) => {
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

/**
 * This migration removes aggregations from IndexedDB and persists them to
 * disk.
 *
 * @param {Function} done - The done callback.
 */
const moveToDiskStorage = (done) => {
  debug('migration pipelines: moveToDiskStorage');
  const userDataDir = remote.app.getPath('userData');
  getObjectStore('readwrite', (store) => {
    const request = store.getAll();
    request.onsuccess = (evt) => {
      const savedPipelines = evt.target.result;
      if (savedPipelines) {
        const tasks = savedPipelines.map((pipeline) => {
          return (callback) => {
            const fileName = path.join(
              userDataDir,
              FS_DIR,
              `${pipeline.id}.json`
            );
            const options = { encoding: 'utf8', flag: 'w' };
            fs.writeFile(fileName, JSON.stringify(pipeline), options, () => {
              callback(null);
            });
          };
        });
        const ensureDirectory = (callback) => {
          const dirName = path.join(userDataDir, FS_DIR);
          fs.mkdir(dirName, { recursive: true }, () => {
            callback();
          });
        };
        asyncr.series([ensureDirectory].concat(tasks), () => {
          done();
        });
      } else {
        done();
      }
    };
  });
};

module.exports = (previousVersion, currentVersion, callback) => {
  moveToDiskStorage(function (err) {
    if (err) {
      debug('encountered an error in the migration', err);
      return callback(null);
    }
    callback(null, 'successful migration to persist pipelines to disk');
  });
};
