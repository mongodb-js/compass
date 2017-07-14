const Collection = require('ampersand-rest-collection');
const Query = require('./query');
const storageMixin = require('storage-mixin');
const electronApp = require('electron').remote.app;

/**
 * Represents a collection of queries.
 */
const QueryCollection = Collection.extend(storageMixin, {
  /**
   * Contains Query models.
   */
  model: Query,
  /**
   * Namespace to store in.
   */
  namespace: 'Queries',
  storage: {
    backend: 'local',
    appName: electronApp.getName()
  },
  mainIndex: '_id'
});

module.exports = QueryCollection;
