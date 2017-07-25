const Query = require('./query');
const electronApp = require('electron').remote.app;
const storageMixin = require('storage-mixin');

/**
 * A model that represents a favorite MongoDB query.
 */
const FavoriteQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'FavoriteQueries',
  storage: {
    backend: 'local',
    appName: electronApp.getName()
  },
  props: {
    /**
     * The query name.
     */
    _name: 'string',
    /**
     * When was the favorite saved
     */
    _dateSaved: 'date'
  }
});

module.exports = FavoriteQuery;
