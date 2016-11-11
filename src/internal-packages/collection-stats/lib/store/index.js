const Reflux = require('reflux');
const app = require('ampersand-app');
const toNS = require('mongodb-ns');
const numeral = require('numeral');
const { NamespaceStore } = require('hadron-reflux-store');
const { ReadPreference } = require('mongodb');

/**
 * The default read preference.
 */
const READ = ReadPreference.PRIMARY_PREFERRED;

/**
 * The reflux store for collection stats.
 */
const CollectionStatsStore = Reflux.createStore({

  /**
   * Initialize the collection stats store.
   */
  init: function() {
    this.listenTo(NamespaceStore, this.loadCollectionStats);
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  },

  /**
   * Load the collection stats.
   */
  loadCollectionStats: function(ns) {
    if (toNS(ns || '').collection) {
      if (this.CollectionStore.readonly) {
        this.trigger();
      } else {
        app.dataService.collection(ns, { readPreference: READ }, (err, result) => {
          if (!err) {
            this.trigger(this._parseCollectionDetails(result));
          }
        });
      }
    }
  },

  _parseCollectionDetails(result) {
    console.log(result);
    return {
      documentCount: this._format(result.document_count),
      totalDocumentSize: this._format(result.document_size, 'b'),
      avgDocumentSize: this._format(this._avg(result.document_size, result.document_count), 'b'),
      indexCount: this._format(result.index_count),
      totalIndexSize: this._format(result.index_size, 'b'),
      avgIndexSize: this._format(this._avg(result.index_size, result.index_count), 'b'),
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
