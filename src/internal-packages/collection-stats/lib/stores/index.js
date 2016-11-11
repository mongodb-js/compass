const Reflux = require('reflux');
const CollectionStatsActions = require('../actions');

const debug = require('debug')('mongodb-compass:stores:collection-stats');

const CollectionStatsStore = Reflux.createStore({
  listenables: CollectionStatsActions,

  sync() {
    debug('it is time to sync!');
  }
});

module.exports = CollectionStatsStore;
