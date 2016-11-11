const Reflux = require('reflux');
const CollectionActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

// const debug = require('debug')('mongodb-compass:stores:collection');

const CollectionStore = Reflux.createStore({

  listenables: CollectionActions,

  mixins: [StateMixin.store],

  getInitialState() {
    return {
      document_count: 0,
      document_size: 0,
      index_count: 0,
      index_size: 0
    };
  },

  sync() {
    if (NamespaceStore.ns) {
      app.dataService.collection(NamespaceStore.ns, {}, (err, stats) => {
        if (!err) {
          this.setState({
            document_count: stats.document_count,
            document_size: stats.document_size,
            index_count: stats.index_count,
            index_size: stats.index_size
          });
        }
      });
    }
  }
});

module.exports = CollectionStore;
