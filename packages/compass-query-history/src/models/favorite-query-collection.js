const Collection = require('ampersand-rest-collection');
const FavoriteQuery = require('./favorite-query');
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
    backend: 'disk',
    basepath: electronApp.getPath('userData')
  },
  mainIndex: '_id',
  comparator: (favorite) => {
    return -favorite._dateSaved;
  }
});

module.exports = FavoriteQueryCollection;
