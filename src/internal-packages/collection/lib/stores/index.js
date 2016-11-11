const Reflux = require('reflux');
const CollectionActions = require('../actions');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;


const debug = require('debug')('mongodb-compass:stores:collection');

const CollectionStatsStore = Reflux.createStore({

  listenables: CollectionActions,

  init: function() {
    // this.state = {stats: {}};
    this.stats = {};
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
        this.stats = stats;
        debug('this.stats is:', this.stats);
        this.trigger(this.stats);
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

module.exports = CollectionStatsStore;
