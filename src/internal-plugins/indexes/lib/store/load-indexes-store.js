const _ = require('lodash');
const Reflux = require('reflux');
const app = require('hadron-app');
const IndexModel = require('mongodb-index-model');
const toNS = require('mongodb-ns');

const Actions = require('../action/index-actions');

/**
 * The reflux store for sorting indexes
 */
const LoadIndexesStore = Reflux.createStore({

  /**
   * Initialize the load indexes store.
   */
  init: function() {
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.listenTo(Actions.loadIndexes, this.loadIndexes);
  },

  onActivated(appRegistry) {
    appRegistry.on('query-changed', this.onQueryChanged.bind(this));
    appRegistry.on('data-service-connected', (err, dataService) => {
      if (!err) {
        this.dataService = dataService;
      }
    });
    appRegistry.on('refresh-data', () => {
      const ns = appRegistry.getStore('App.NamespaceStore').ns;
      // TODO: only refresh when we are in the index tab; for now just check if
      // we are in the documents set of tabs.
      if (ns.indexOf('.' === 0)) this.loadIndexes(ns);
    });
  },

  /**
   * Load the indexes on query change
   * @param {Object} ns namespace to load indexes on
   */
  loadIndexes(ns) {
    if (ns && toNS(ns).collection) {
      if (this.CollectionStore.isReadonly()) {
        this.trigger([]);
      } else {
        this.dataService.indexes(ns, {}, (err, indexes) => {
          if (err) {
            this.trigger([], err);
          } else {
            this.trigger(this._convertToModels(indexes));
          }
        });
      }
    }
  },

  /**
   * Triggers on query change (Includes namespace changes)
   * TODO: link to the query-bar plugin and indicate this is a lifecyle method
   *
   * @param{Object} query the query changed state
   */
  onQueryChanged(query) {
    this.loadIndexes(query.ns);
  },

  /**
   * Converts the raw index data to Index models and does calculations.
   *
   * @param {Array} indexes - The indexes.
   *
   * @returns {Array} The index models.
   */
  _convertToModels(indexes) {
    const maxSize = this._computeMaxSize(indexes);
    return _.map(indexes, (index) => {
      const model = new IndexModel(new IndexModel().parse(index));
      model.relativeSize = model.size / maxSize * 100;
      return model;
    });
  },

  /**
   * Get the biggest index size.
   *
   * @param {Array} indexes - The indexes.
   *
   * @returns {Integer} The largest size.
   */
  _computeMaxSize(indexes) {
    return _.max(indexes, (index) => {
      return index.size;
    }).size;
  }
});

module.exports = LoadIndexesStore;
