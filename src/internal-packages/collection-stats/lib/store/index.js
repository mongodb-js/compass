const Reflux = require('reflux');
const app = require('hadron-app');
const numeral = require('numeral');
const actions = require('../actions');

/**
 * The reflux store for collection stats.
 */
const CollectionStatsStore = Reflux.createStore({

  listenables: actions,

  /**
   * Initialize the collection stats store.
   */
  init: function() {
    this.NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
  },

  /**
   * Load the collection stats.
   *
   * @param {String} isReadonly - is the collection readonly?
   */
  loadCollectionStats: function(ns, isReadonly) {
    if (isReadonly) {
      this.trigger();
    } else {
      app.dataService.collection(ns, {}, (err, result) => {
        if (!err) {
          this.trigger(this._parseCollectionDetails(result));
        }
      });
    }
  },

  _parseCollectionDetails(result) {
    return {
      documentCount: this._format(result.document_count),
      totalDocumentSize: this._format(result.document_size, 'b'),
      avgDocumentSize: this._format(this._avg(result.document_size, result.document_count), 'b'),
      indexCount: this._format(result.index_count),
      totalIndexSize: this._format(result.index_size, 'b'),
      avgIndexSize: this._format(this._avg(result.index_size, result.index_count), 'b')
    };
  },

  _avg(size, count) {
    if (count <= 0) {
      return 0;
    }
    return size / count;
  },

  _format(value, format = 'a') {
    const precision = value <= 1000 ? '0' : '0.0';
    return numeral(value).format(precision + format);
  }
});

module.exports = CollectionStatsStore;
