const Collection = require('ampersand-rest-collection');
const FavoriteQuery = require('./query');
const storageMixin = require('storage-mixin');
const electronApp = require('electron').remote.app;

/**
 * Represents a collection of favorite queries.
 */
const FavoriteQueryCollection = Collection.extend(storageMixin, {
  /**
   * Contains FavoriteQuery models.
   */
  model: FavoriteQuery,
  /**
   * Namespace to store in.
   */
  namespace: 'FavoriteQueries',
  storage: {
    backend: 'local',
    appName: electronApp.getName()
  },
  mainIndex: '_id',
  comparator: (favorite) => {
    return -favorite._dateSaved;
  }
});

module.exports = FavoriteQueryCollection;
