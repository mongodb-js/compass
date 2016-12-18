const Reflux = require('reflux');
const Action = require('../action/index-actions');
const LoadIndexesStore = require('./load-indexes-store');
const UpdateIndexesStore = require('./update-indexes-store');

const DEFAULT = 'Name and Definition';
const ASC = 'fa-sort-asc';
const DESC = 'fa-sort-desc';
const USAGE = 'Usage';

/**
 * The reflux store for sorting indexes
 */
const SortIndexesStore = Reflux.createStore({

  /**
   * Initialize the sort indexes store.
   */
  init: function() {
    this.sortField = DEFAULT;
    this.sortOrder = ASC;
    this.listenTo(LoadIndexesStore, this.loadIndexes);
    this.listenTo(UpdateIndexesStore, this.loadIndexes);
    this.listenTo(Action.sortIndexes, this.sortIndexes);
  },

  /**
   * Load the indexes into the store.
   *
   * @param {Array} indexes - The indexes.
   */
  loadIndexes(indexes) {
    this.indexes = indexes;
    this.sortIndexes(this.sortField, false);
  },

  /**
   * Sort the indexes
   *
   * @param {String} column - The column to sort on.
   * @param {Boolean} reverse - If we should reverse the order.
   */
  sortIndexes: function(column, reverse = true) {
    if (reverse) {
      this._setOrder(column);
    }
    this.indexes.sort(this._comparator(this._field()));
    this.trigger(this.indexes, this.sortOrder, this.sortField);
  },

  /**
   * Set the sort order.
   *
   * @param {String} column - The column.
   */
  _setOrder(column) {
    if (this.sortField === column) {
      this.sortOrder = (this.sortOrder === ASC) ? DESC : ASC;
    } else {
      this.sortField = column;
      this.sortOrder = (column === DEFAULT) ? ASC : DESC;
    }
  },

  /**
   * Get a comparator function for the sort.
   *
   * @param {String} field - The field to sort on.
   *
   * @returns {Function} The function.
   */
  _comparator(field) {
    const order = (this.sortOrder === ASC) ? 1 : -1;
    if (field === 'properties') {
      return this._propertiesComparator(order);
    }
    return function(a, b) {
      if (a[field] > b[field]) {
        return order;
      }
      if (a[field] < b[field]) {
        return -order;
      }
      return 0;
    };
  },

  /**
   * Get the comparator for properties.
   *
   * @param {Integer} order - The order.
   *
   * @returns {Function} The comparator function.
   */
  _propertiesComparator(order) {
    return function(a, b) {
      const aValue = (a.cardinality === 'compound') ? 'compound' : (a.properties[0] || '');
      const bValue = (b.cardinality === 'compound') ? 'compound' : (b.properties[0] || '');
      if (aValue > bValue) {
        return order;
      }
      if (aValue < bValue) {
        return -order;
      }
      return 0;
    };
  },

  /**
   * Get the name of the field to sort on based on the column header.
   *
   * @returns {String} The field.
   */
  _field() {
    if (this.sortField === DEFAULT) {
      return 'name';
    } else if (this.sortField === USAGE) {
      return 'usageCount';
    }
    return this.sortField.toLowerCase();
  }
});

module.exports = SortIndexesStore;
