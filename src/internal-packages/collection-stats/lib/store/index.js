const Reflux = require('reflux');
const app = require('hadron-app');
const toNS = require('mongodb-ns');
const numeral = require('numeral');

/**
 * The reflux store for collection stats.
 */
const CollectionStatsStore = Reflux.createStore({

  /**
   * Initialize the collection stats store.
   */
  init: function() {
    this.NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
    this.listenTo(this.NamespaceStore, this.loadCollectionStats);
  },

  /**
   * Load the collection stats.
   *
   * @param {String} ns - The namespace.
   */
  loadCollectionStats: function(ns) {
    if (toNS(ns || '').collection) {
      if (this._isCollectionReadonly()) {
        this.trigger();
      } else {
        app.dataService.collection(ns, {}, (err, result) => {
          if (!err) {
            this.trigger(this._parseCollectionDetails(result));
          }
        });
      }
    }
  },

  /**
   * Determine if the collection is readonly.
   *
   * @note Durran: The wacky logic here is because the ampersand app is not
   *  loaded in the unit test environment and the validation tests fail since
   *  not app registry is found. Once we get rid of the ampersand app we can
   *  put the store set back into the init once we've sorted out the proper
   *  test strategy. Same as collections-store and query-store.
   *
   * @returns {Boolean} If the collection is readonly.
   */
  _isCollectionReadonly() {
    if (this.CollectionStore) {
      return this.CollectionStore.isReadonly();
    }
    const registry = app.appRegistry;
    if (registry) {
      this.CollectionStore = registry.getStore('App.CollectionStore');
      return this.CollectionStore.isReadonly();
    }
    return false;
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
