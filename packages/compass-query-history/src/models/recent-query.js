const Query = require('./query');
const electronApp = require('electron').remote.app;
const storageMixin = require('storage-mixin');

/**
 * A model that represents a recent MongoDB query.
 */
const RecentQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'RecentQueries',
  storage: {
    backend: 'local',
    appName: electronApp.getName()
  }
});

module.exports = RecentQuery;
