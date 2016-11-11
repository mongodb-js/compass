const Reflux = require('reflux');
const CollectionActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;


const debug = require('debug')('mongodb-compass:stores:collection');

const CollectionStore = Reflux.createStore({

  listenables: CollectionActions,

  mixins: [StateMixin.store],

  init: function() {
    // this.state = {stats: {}};
  },

  getInitialState() {
    return {
      // stats: {},
      document_count: 0,
      document_size: 0,
      // document_size_average: 0,
      index_count: 0,
      index_size: 0
      // index_size_average: 0
    };
  },

  /*
  _format(value) {
    var precision = value <= 1000 ? '0' : '0.0';
    var format = propertyName.indexOf('_size') > -1 ? ' b' : 'a';
    return numeral(value).format(precision + format);
  },*/

  sync() {
    debug('it is time to sync!');

    if (NamespaceStore.ns) {
      app.dataService.collection(NamespaceStore.ns, {}, (err, stats) => {
        if (err) {
          return debug('error fetching collection with namespace', NamespaceStore.ns);
        }
        debug('stats is:', stats);
        this.setState({
          // stats: stats,
          document_count: stats.document_count,
          document_size: stats.document_size,
          index_count: stats.index_count,
          index_size: stats.index_size
        });
        debug('state is:', this.state);
      });
    }
  }

    /* debug(model);
    var value = model.get(propertyName) || 0;
    this.setState({
      document_count: model.get('document_count') || 0,
      document_count: model.get('document_size') || 0,
      document_count: model.get('document_size_average') || 0,
      document_count: model.get('document_count') || 0,
      document_count: model.get('document_count') || 0,
      document_count: model.get('document_count') || 0
    });*/
});

module.exports = CollectionStore;
