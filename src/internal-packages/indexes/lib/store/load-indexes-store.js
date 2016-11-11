const _ = require('lodash');
const Reflux = require('reflux');
const app = require('ampersand-app');
const IndexModel = require('mongodb-index-model');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Action = require('../action/index-actions');
const ReadPreference = require('mongodb').ReadPreference;

/**
 * The default read preference.
 */
const READ = ReadPreference.PRIMARY_PREFERRED;

/**
 * The reflux store for sorting indexes
 */
const LoadIndexesStore = Reflux.createStore({

  /**
   * Initialize the load indexes store.
   */
  init: function() {
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.listenTo(Action.loadIndexes, this.loadIndexes);
  },

  /**
   * Load the indexes.
   */
  loadIndexes: function() {
    if (NamespaceStore.ns) {
      if (this.CollectionStore.readonly) {
        this.trigger([]);
      } else {
        app.dataService.indexes(NamespaceStore.ns, { readPreference: READ }, (err, indexes) => {
          if (!err) {
            this.trigger(this._convertToModels(indexes));
          }
        });
      }
    }
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
