const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const numeral = require('numeral');

/**
 * The reflux store for collection stats.
 */
const CollectionStatsStore = Reflux.createStore({

  onActivated: function(registry) {
    this.NamespaceStore = registry.getStore('App.NamespaceStore');
    this.CollectionStore = registry.getStore('App.CollectionStore');
    this.listenTo(this.NamespaceStore, this.loadCollectionStats.bind(this));
    registry.getAction('CRUD.Actions').documentRemoved.listen(this.documentRemoved.bind(this));
    registry.on('data-service-connected', (err, dataService) => {
      if (!err) {
        this.dataService = dataService;
      }
    });
  },

  documentRemoved: function() {
    this.loadCollectionStats(this.NamespaceStore.ns);
  },

  /**
   * Load the collection stats.
   *
   * @param {String} ns - The namespace.
   */
  loadCollectionStats: function(ns) {
    if (toNS(ns || '').collection) {
      if (this.CollectionStore.isReadonly()) {
        this.trigger();
      } else {
        this.dataService.collection(ns, {}, (err, result) => {
          if (!err) {
            this.trigger(this._parseCollectionDetails(result));
          }
        });
      }
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
