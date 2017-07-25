const Collection = require('ampersand-rest-collection');
const RecentQuery = require('./query');
const storageMixin = require('storage-mixin');
const electronApp = require('electron').remote.app;

/**
 * Represents a collection of recent queries.
 */
const RecentQueryCollection = Collection.extend(storageMixin, {
  /**
   * Contains RecentQuery models.
   */
  model: RecentQuery,
  /**
   * Namespace to store in.
   */
  namespace: 'RecentQueries',
  storage: {
    backend: 'local',
    appName: electronApp.getName()
  },
  mainIndex: '_id',
  comparator: (recent) => {
    return -recent._lastExecuted;
  }
});

module.exports = RecentQueryCollection;
