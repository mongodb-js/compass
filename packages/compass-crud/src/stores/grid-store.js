const Reflux = require('reflux');
const Actions = require('../actions');
const _ = require('lodash');

const MIXED = 'Mixed';

const GridStore = Reflux.createStore( {

  init: function() {
    this.columns = {};
    this.showing = {};
    this.listenTo(Actions.addColumn, this.addColumn.bind(this));
    this.listenTo(Actions.removeColumn, this.removeColumn.bind(this));
    this.listenTo(Actions.resetHeaders, this.resetColumns.bind(this));
    this.listenTo(Actions.elementAdded, this.elementAdded.bind(this));
    this.listenTo(Actions.elementRemoved, this.elementRemoved.bind(this));
    this.listenTo(Actions.elementTypeChanged, this.elementTypeChanged.bind(this));

    this.setShowing = this.setShowing.bind(this);
  },

  /**
   * Get the type of every element with key, or MIXED.
   *
   * @param {String} key - The column key.
   *
   */
  setShowing(key) {
    const types = Object.values(this.columns[key]);
    let type = types[0];
    for (let i = 0; i < types.length; i++) {
      if (type !== types[i]) {
        type = MIXED;
        break;
      }
    }
    this.showing[key] = type;
  },

  /**
   * Set the initial type for each column header.
   *
   * @param {Object} columns - A mapping of column names to a mapping of ObjectIds
   * to BSON types.
   */
  resetColumns(columns) {
    this.showing = {};
    this.columns = columns;

    const columnNames = Object.keys(columns);
    for (let i = 0; i < columnNames.length; i++) {
      this.setShowing(columnNames[i]);
    }
  },

  /**
   * A new element has been added to a document. If the new type will change
   * the column header type, then trigger a change on the grid.
   *
   * @param {Element} element - The newly added element.
   * @param {ObjectId} oid - The ObjectId of the parent document.
   */
  elementAdded(element, oid) {
    const key = element.currentKey;
    const type = element.currentType;

    let oldType = null;

    if (!(key in this.columns)) {
      this.columns[key] = {};
      this.columns[key][oid] = type;
      this.showing[key] = type;
    } else {
      this.columns[key][oid] = type;
      oldType = this.showing[key];
      if (type !== oldType) {
        this.showing[key] = MIXED;
      }
    }

    if (oldType !== this.showing[key]) {
      const params = {updateHeaders: {showing: {}}};
      params.updateHeaders.showing[key] = this.showing[key];
      this.trigger(params);
    }
  },

  /**
   * A element has been deleted from the column. If the value was the last
   * value in the column, delete the column. If the type was mixed, and there
   * are other elements in the column, recalculate the header type.
   *
   * @param {String} key - The removed element's key.
   * @param {ObjectId} oid - The ObjectId of the parent element.
   */
  elementRemoved(key, oid) {
    delete this.columns[key][oid];
    const params = {};

    if (_.isEmpty(this.columns[key])) {
      delete this.columns[key];
      /* Don't delete column until update is clicked */
      // params.remove = {colIds: [key]};
    } else {
      const oldType = this.showing[key];
      if (oldType === MIXED) {
        this.setShowing(key);
      }

      if (oldType !== this.showing[key]) {
        params.updateHeaders = {showing: {}};
        params.updateHeaders.showing[key] = this.showing[key];
      }
    }
    this.trigger(params);
  },


  elementTypeChanged(element, oid) {
    const key = element.currentKey;
    const type = element.currentType;
    const oldType = this.showing[key];

    this.columns[key][oid] = type;

    if (type !== oldType) {
      if (oldType === MIXED) {
        this.setShowing(key);
      } else {
        this.showing[key] = MIXED;
      }
      if (oldType !== this.showing[key]) {
        const params = {updateHeaders: {showing: {}}};
        params.updateHeaders.showing[key] = this.showing[key];
        this.trigger(params);
      }
    }
  },

  addColumn: function(columnBefore, rowIndex) {
    this.trigger({add: {colId: columnBefore, rowIndex: rowIndex}});
  },

  removeColumn: function(colId) {
    this.trigger({remove: {colIds: [colId]}});
  }
});

module.exports = GridStore;
