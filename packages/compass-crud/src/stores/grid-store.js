const Reflux = require('reflux');
const Actions = require('../actions');
const _ = require('lodash');

const MIXED = 'Mixed';

const GridStore = Reflux.createStore( {

  init: function() {
    this.columns = {};
    this.showing = {};
    this.stageRemove = {};
    this.listenTo(Actions.addColumn, this.addColumn.bind(this));
    this.listenTo(Actions.removeColumn, this.removeColumn.bind(this));
    this.listenTo(Actions.resetHeaders, this.resetColumns.bind(this));
    this.listenTo(Actions.cleanCols, this.cleanCols.bind(this));
    this.listenTo(Actions.elementAdded, this.elementAdded.bind(this));
    this.listenTo(Actions.elementRemoved, this.elementRemoved.bind(this));
    this.listenTo(Actions.elementMarkRemoved, this.elementMarkRemoved.bind(this));
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
   * Helper to add/remove elements from the stageRemove object, which tracks
   * if an element is marked as deleted but not actually removed. Needed because
   * we want to delete columns that are empty, but not if something is staged.
   *
   * @param {String} key - The column ID.
   * @param {ObjectId} oid - The OID of the document.
   * @param {boolean} add - True if we are marking a field as deleted. False if
   * we are no longer tracking that field (either because it was actually
   * deleted or undo/cancel was clicked.
   */
  stageField(key, oid, add) {
    if (add) {
      if (!(key in this.stageRemove)) {
        this.stageRemove[key] = {};
      }
      this.stageRemove[key][oid] = true;
    } else if (key in this.stageRemove) {
      delete this.stageRemove[key][oid];
      if (_.isEmpty(this.stageRemove[key])) {
        delete this.stageRemove[key];
      }
    }
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
   * After an update, go through and see if any columns are empty. If so,
   * delete them.
   */
  cleanCols() {
    const toDel = [];

    const columnNames = Object.keys(this.showing);
    for (let i = 0; i < columnNames.length; i++) {
      const name = columnNames[i];
      if (!(name in this.columns) && !(name in this.stageRemove)) {
        toDel.push(name);
        delete this.showing[name];
      }
    }
    if (toDel.length) {
      this.trigger({remove: {colIds: toDel}});
    }
  },

  /**
   * A new element has been added to a document. If the new type will change
   * the column header type, then trigger a change on the grid.
   *
   * @param {String} key - The newly added element's fieldname.
   * @param {String} type - The newly added element's type.
   * @param {ObjectId} oid - The ObjectId of the parent document.
   */
  elementAdded(key, type, oid) {
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

    this.stageField(key, oid, false);

    if (oldType !== this.showing[key]) {
      const params = {updateHeaders: {showing: {}}};
      params.updateHeaders.showing[key] = this.showing[key];
      this.trigger(params);
    }
  },

  /**
   * A element has been marked as deleted from the column. Need to remove it
   * from this.columns/this.showing so that the header types will be updated
   * immediately, but add it to this.markedRemoved so that we don't remove
   * columns when there are still fields that are marked as deleted but not
   * fully removed.
   *
   * @param {String} key - The removed element's key.
   * @param {ObjectId} oid - The ObjectId of the parent element.
   */
  elementMarkRemoved(key, oid) {
    delete this.columns[key][oid];
    const params = {};

    /* Need to track columns that are marked as deletion but not removed yet */
    this.stageField(key, oid, true);

    /* Update the headers */
    if (_.isEmpty(this.columns[key])) {
      delete this.columns[key];
    } else {
      const oldType = this.showing[key];
      if (oldType === MIXED) {
        this.setShowing(key);
      }
      if (oldType !== this.showing[key]) {
        params.updateHeaders = {showing: {}};
        params.updateHeaders.showing[key] = this.showing[key];
        this.trigger(params);
      }
    }
  },

  /**
   * A element has been deleted from the column. Can be deleted after being
   * marked for deletion or can just be deleted. If the type was mixed, and
   * there are other elements in the column, recalculate the header type.
   *
   * @param {String} key - The removed element's key.
   * @param {ObjectId} oid - The ObjectId of the parent element.
   */
  elementRemoved(key, oid) {
    if (this.columns[key] && this.columns[key][oid]) {
      delete this.columns[key][oid];
    }
    const params = {};

    /* Need to track columns that are marked as deletion but not removed yet */
    this.stageField(key, oid, false);

    /* Update the headers */
    if (_.isEmpty(this.columns[key])) {
      delete this.columns[key];
      if (!(key in this.stageRemove)) {
        params.remove = {colIds: [key]};
      }
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

    if (!_.isEmpty(params)) {
      this.trigger(params);
    }
  },


  /**
   * The type of an element has changed. If the new type will change
   * the column header type, then trigger a change on the grid.
   *
   * @param {String} key - The newly added element's fieldname.
   * @param {String} type - The newly added element's type.
   * @param {ObjectId} oid - The ObjectId of the parent document.
   */
  elementTypeChanged(key, type, oid) {
    const oldType = this.showing[key];

    this.columns[key][oid] = type;

    if (type !== oldType) {
      if (oldType === MIXED) {
        this.setShowing(key);
      } else {
        this.showing[key] = (Object.keys(this.columns[key]).length === 1) ? type : MIXED;
      }
      if (oldType !== this.showing[key]) {
        const params = {updateHeaders: {showing: {}}};
        params.updateHeaders.showing[key] = this.showing[key];
        this.trigger(params);
      }
    }
  },

  addColumn: function(columnBefore, rowIndex, path) {
    this.trigger({add: {colId: columnBefore, rowIndex: rowIndex, path: path}});
  },

  removeColumn: function(colId) {
    this.trigger({remove: {colIds: [colId]}});
  }
});

module.exports = GridStore;
