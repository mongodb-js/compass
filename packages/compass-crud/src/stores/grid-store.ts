/* eslint-disable complexity */
import type { Listenable, Store } from 'reflux';
import Reflux from 'reflux';
import { isEmpty, cloneDeep, forEach } from 'lodash';
import type { TypeCastTypes } from 'hadron-type-checker';
import TypeChecker from 'hadron-type-checker';
import { BaseRefluxStore } from './base-reflux-store';
import type { BSONObject } from './crud-store';

export type TableHeaderType = TypeCastTypes | 'Mixed';

export interface GridActions {
  addColumn(
    newColId: string,
    columnBefore: string,
    rowIndex: number,
    path: (string | number)[],
    isArray: boolean,
    editOnly: boolean,
    oid: string
  ): void;
  removeColumn(colId: string): void;
  renameColumn(oldColId: string, newColId: string): void;
  elementAdded(key: string, type: TableHeaderType, oid: string): void;
  elementRemoved(key: string, oid: string, isArray: boolean): void;
  elementTypeChanged(key: string, type: TableHeaderType, oid: string): void;
  elementMarkRemoved(key: string, oid: string): void;
  resetColumns(columns: Record<string, Record<string, TableHeaderType>>): void;
  cleanCols(): void;
  replaceDoc(oldOid: string, newOid: string, newDoc: BSONObject): void;
}

export type GridStoreOptions = {
  actions: {
    [key in keyof GridActions]: Listenable;
  };
};

export type GridStoreTriggerParams = {
  refresh?: { oid: string };
  add?: {
    colIdBefore: string;
    newColId: string;
    colType: TableHeaderType | '';
    path: (string | number)[];
    isArray: boolean;
  };
  updateHeaders?: { showing: Record<string, TableHeaderType> };
  remove?: { colIds: string[] };
  edit?: {
    colId: string;
    rowIndex: number;
  };
};

const MIXED = 'Mixed';

class GridStoreImpl
  extends BaseRefluxStore<GridStoreOptions>
  implements GridActions
{
  columns!: Record<string, Record<string, TableHeaderType>>; // field key -> oid -> type
  showing!: Record<string, TableHeaderType>;
  stageRemove!: Record<string, Record<string, boolean>>;
  trigger!: (params: GridStoreTriggerParams) => void;

  constructor(options: GridStoreOptions) {
    super(options);
  }

  init() {
    const actions = this.options.actions;

    this.columns = {};
    this.showing = {};
    this.stageRemove = {};
    this.listenTo(actions.addColumn, this.addColumn.bind(this));
    this.listenTo(actions.removeColumn, this.removeColumn.bind(this));
    this.listenTo(actions.resetColumns, this.resetColumns.bind(this));
    this.listenTo(actions.cleanCols, this.cleanCols.bind(this));
    this.listenTo(actions.elementAdded, this.elementAdded.bind(this));
    this.listenTo(actions.elementRemoved, this.elementRemoved.bind(this));
    this.listenTo(
      actions.elementMarkRemoved,
      this.elementMarkRemoved.bind(this)
    );
    this.listenTo(
      actions.elementTypeChanged,
      this.elementTypeChanged.bind(this)
    );
    this.listenTo(actions.renameColumn, this.renameColumn.bind(this));
    this.listenTo(actions.replaceDoc, this.replaceDoc.bind(this));

    this.setShowing = this.setShowing.bind(this);
  }

  /**
   * Get the type of every element with key, or MIXED.
   *
   * @param {String} key - The column key.
   *
   */
  setShowing(key: string) {
    if (!(key in this.columns)) {
      return;
    }
    const types = Object.values(this.columns[key]);
    let type: TableHeaderType = types[0];
    for (let i = 0; i < types.length; i++) {
      if (type !== types[i]) {
        type = MIXED;
        break;
      }
    }
    this.showing[key] = type;
  }

  /**
   * Helper to add/remove elements from the stageRemove object, which tracks
   * if an element is marked as deleted but not actually removed. Needed because
   * we want to delete columns that are empty, but not if something is staged.
   * this.stagedRemove is a mapping of colId to objectId to boolean.
   *
   * @param {String} key - The column ID.
   * @param {String} oid - The OID string of the document.
   * @param {boolean} add - True if we are marking a field as deleted. False if
   * we are no longer tracking that field (either because it was actually
   * deleted or undo/cancel was clicked.
   */
  stageField(key: string, oid: string, add: boolean): void {
    if (add) {
      if (!(key in this.stageRemove)) {
        this.stageRemove[key] = {};
      }
      this.stageRemove[key][oid] = true;
    } else if (key in this.stageRemove) {
      delete this.stageRemove[key][oid];
      if (isEmpty(this.stageRemove[key])) {
        delete this.stageRemove[key];
      }
    }
  }

  /**
   * Set the initial type for each column header.
   *
   * @param {Object} columns - A mapping of column names to a mapping of ObjectIds
   * to BSON types.
   */
  resetColumns(columns: Record<string, Record<string, TypeCastTypes>>) {
    this.showing = {};
    this.stageRemove = {};
    this.columns = cloneDeep(columns);

    const columnNames = Object.keys(columns);
    for (let i = 0; i < columnNames.length; i++) {
      this.setShowing(columnNames[i]);
    }
  }

  /**
   * If all a document's elements need to be replaced. Called when receiving
   * a new document from the DB after an update, or resetting after cancel.
   *
   * @param {String} oldOid
   * @param {String} newOid
   * @param {Object} newDoc
   */
  replaceDoc(oldOid: string, newOid: string, newDoc: BSONObject) {
    const params: GridStoreTriggerParams = { refresh: { oid: newOid } };

    /* Replace types in this.columns */
    forEach(this.columns, (val, key) => {
      if (oldOid in this.columns[key]) {
        delete this.columns[key][oldOid];
        if (isEmpty(this.columns[key])) {
          delete this.columns[key];
        }
      }
      if (key in newDoc) {
        if (!(key in this.columns)) {
          this.columns[key] = {};
        }
        this.columns[key][newOid] = TypeChecker.type(newDoc[key]);
      }
      this.setShowing(key);
    });

    /* Replace items marked as removed */
    forEach(this.stageRemove, (val, key) => {
      if (key in this.stageRemove && oldOid in this.stageRemove[key]) {
        delete this.stageRemove[key][oldOid];
        if (isEmpty(this.stageRemove[key])) {
          delete this.stageRemove[key];
        }
      }
    });

    /* If new element has fields that were not previously tracked */
    forEach(newDoc, (val, key) => {
      if (key !== '_id' && !(key in this.columns)) {
        const type = TypeChecker.type(newDoc[key]);
        this.columns[key] = {};
        this.columns[key][newOid] = type;
        this.setShowing(key);
      }
    });

    params.updateHeaders = { showing: this.showing };

    this.trigger(params);
  }

  /**
   * Rename a column. Right now only used for $new.
   * @param {String} oldKey
   * @param {String} newKey
   */
  renameColumn(oldKey: string, newKey: string) {
    if (!this.columns[oldKey]) {
      return;
    }
    this.columns[newKey] = this.columns[oldKey];
    this.setShowing(newKey);
    if (this.stageRemove[oldKey]) {
      this.stageRemove[newKey] = this.stageRemove[oldKey];
    }

    delete this.columns[oldKey];
    delete this.stageRemove[oldKey];
    delete this.showing[oldKey];
  }

  /**
   * After an update or cancel, go through and see if any columns are empty.
   * If so, delete them.
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
      this.trigger({ remove: { colIds: toDel } });
    }
  }

  /**
   * A new element has been added to a document. If the new type will change
   * the column header type, then trigger a change on the grid.
   *
   * @param {String} key - The newly added element's fieldname.
   * @param {String} type - The newly added element's type.
   * @param {String} oid - The ObjectId string of the parent document.
   */
  elementAdded(key: string, type: TableHeaderType, oid: string) {
    let oldType: TableHeaderType | undefined;

    if (!(key in this.columns)) {
      this.columns[key] = {};
      this.columns[key][oid] = type;
      this.showing[key] = type;
    } else {
      this.columns[key][oid] = type;
      oldType = this.showing[key];
      if (Object.keys(this.columns[key]).length < 2) {
        this.showing[key] = type;
      } else if (type !== oldType) {
        this.showing[key] = MIXED;
      }
    }

    this.stageField(key, oid, false);

    if (oldType !== this.showing[key]) {
      const params = {
        updateHeaders: {
          showing: {
            [key]: this.showing[key],
          },
        },
      };
      this.trigger(params);
    }
  }

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
  elementMarkRemoved(key: string, oid: string) {
    delete this.columns[key][oid];

    /* Need to track columns that are marked as deletion but not removed yet */
    this.stageField(key, oid, true);

    /* Update the headers */
    if (isEmpty(this.columns[key])) {
      delete this.columns[key];
    } else {
      const oldType = this.showing[key];
      if (oldType === MIXED) {
        this.setShowing(key);
      }
      if (oldType !== this.showing[key]) {
        const params = {
          updateHeaders: { showing: { [key]: this.showing[key] } },
        };
        this.trigger(params);
      }
    }
  }

  /**
   * A element has been deleted from the column. Can be deleted after being
   * marked for deletion or can just be deleted. If the type was mixed, and
   * there are other elements in the column, recalculate the header type.
   *
   * @param {String} key - The removed element's key.
   * @param {String} oid - The ObjectId of the parent element.
   * @param {Boolean} isArray - If the parent of the element is an array.
   */
  elementRemoved(key: string, oid: string, isArray: boolean) {
    const params: Record<string, unknown> = {};
    const newShowing: typeof this.showing = {};

    /* If it's an array element, need to move subsequent elements up */
    if (isArray) {
      for (let i = +key; i < Object.keys(this.showing).length; i++) {
        /* Move columns, updating headers or removing the last column if needed */

        if (i + 1 in this.columns && oid in this.columns[i + 1]) {
          if (!(i in this.columns)) {
            this.columns[i] = {};
          }
          this.columns[i][oid] = this.columns[i + 1][oid];

          this.stageField(String(i), oid, false);

          if (this.showing[i] !== this.columns[i][oid]) {
            this.setShowing(String(i));
            newShowing[i] = this.showing[i];
          }
        } else if (
          i + 1 in this.stageRemove &&
          oid in this.stageRemove[i + 1]
        ) {
          this.stageField(String(i), oid, true);
          if (i in this.columns) {
            delete this.columns[i][oid];
            if (isEmpty(this.columns[i])) {
              delete this.columns[i];
            }
            this.setShowing(String(i));
            newShowing[i] = this.showing[i];
          }
        } else {
          this.stageField(String(i), oid, false);

          if (i in this.columns) {
            delete this.columns[i][oid];
            if (isEmpty(this.columns[i])) {
              delete this.columns[i];
            } else {
              this.setShowing(String(i));
              newShowing[i] = this.showing[i];
            }
          }

          if (!(i in this.columns) && !(i in this.stageRemove)) {
            params.remove = { colIds: [i] };
            delete this.showing[i];
          }
        }
      }
      params.refresh = { oid: oid };
    } else {
      if (this.columns[key] && this.columns[key][oid]) {
        delete this.columns[key][oid];
      }

      /* Need to track columns that are marked as deletion but not removed yet */
      this.stageField(key, oid, false);

      /* Update the headers */
      if (isEmpty(this.columns[key])) {
        delete this.columns[key];
        if (!(key in this.stageRemove)) {
          params.remove = { colIds: [key] };
          delete this.showing[key];
        }
      } else {
        const oldType = this.showing[key];
        if (oldType === MIXED) {
          this.setShowing(key);
        }

        if (oldType !== this.showing[key]) {
          newShowing[key] = this.showing[key];
        }
      }
    }

    if (!isEmpty(newShowing)) {
      params.updateHeaders = { showing: newShowing };
    }

    if (!isEmpty(params)) {
      this.trigger(params);
    }
  }

  /**
   * The type of an element has changed. If the new type will change
   * the column header type, then trigger a change on the grid.
   *
   * @param {String} key - The newly added element's fieldname.
   * @param {String} type - The newly added element's type.
   * @param {ObjectId} oid - The ObjectId of the parent document.
   */
  elementTypeChanged(key: string, type: TableHeaderType, oid: string) {
    const oldType = this.showing[key];

    this.columns[key][oid] = type;

    if (type !== oldType) {
      if (oldType === MIXED) {
        this.setShowing(key);
      } else {
        this.showing[key] =
          Object.keys(this.columns[key]).length === 1 ? type : MIXED;
      }
      if (oldType !== this.showing[key]) {
        const params = {
          updateHeaders: { showing: { [key]: this.showing[key] } },
        };
        this.trigger(params);
      }
    }
  }

  /**
   * A new column must be added to the grid.
   *
   * @param {String} newColId - $new or the index of the column.
   * @param {String} columnBefore - The colId of the column to insert the new column after.
   * @param {Integer} rowIndex - The row index to start editing.
   * @param {Array} path - The series of fieldnames or indexes.
   * @param {Boolean} isArray - If we are inserting into an array.
   * @param {Boolean} editOnly - Don't actually add a column, just start editing
   * (for the case where we're adding to an array but the column already exists).
   * @param {String} oid - The string representation of the _id field of the row.
   */
  addColumn(
    newColId: string,
    columnBefore: string,
    rowIndex: number,
    path: (string | number)[],
    isArray: boolean,
    editOnly: boolean,
    oid: string
  ) {
    const params: GridStoreTriggerParams = {
      edit: {
        colId: newColId,
        rowIndex: rowIndex,
      },
    };
    if (!editOnly) {
      params.add = {
        newColId: newColId,
        colIdBefore: columnBefore,
        path: path,
        isArray: isArray,
        colType: '',
      };
    }
    /* If we're inserting into an array, need to update headers */
    if (isArray) {
      let currentMax = Object.keys(this.showing).length - 1;
      /* Add to this.columns if adding to a new column */
      if (!editOnly) {
        currentMax++;
        this.columns[currentMax] = {};
      }
      const newShowing: typeof this.showing = {};

      /* For each col after the col inserted, move the values to the right */
      for (let index = currentMax; index > +newColId; index--) {
        if (index - 1 in this.columns && oid in this.columns[index - 1]) {
          if (!(index in this.columns)) {
            this.columns[index] = {};
          }
          this.columns[index][oid] = this.columns[index - 1][oid];
          this.setShowing(String(index));
          newShowing[index] = this.showing[index];
        } else if (
          index - 1 in this.stageRemove &&
          oid in this.stageRemove[index - 1]
        ) {
          /* If a field is empty because it's marked as removed, not end of array */
          if (index in this.columns) {
            delete this.columns[index][oid];
            if (isEmpty(this.columns[index])) {
              delete this.columns[index];
            }
          }
          if (!(index in this.showing)) {
            this.showing[index] = this.showing[index - 1];
          }
        }

        /* Update stagedRemove */
        this.stageField(String(index), oid, false);
        if (String(index - 1) in this.stageRemove) {
          if (oid in this.stageRemove[index - 1]) {
            this.stageField(String(index), oid, true);
          }
        }
      }
      /* Remove the element that was in the newColId's place */
      if (newColId in this.columns) {
        delete this.columns[newColId][oid];
        if (isEmpty(this.columns[newColId])) {
          delete this.columns[newColId];
        } else {
          this.setShowing(newColId);
          newShowing[newColId] = this.showing[newColId];
        }
      }

      /* The newly added column can't be marked as removed */
      this.stageField('' + newColId, oid, false);
      if (!isEmpty(newShowing)) {
        params.updateHeaders = { showing: newShowing };
      }
    }
    this.trigger(params);
  }

  /**
   * A column must be removed from the grid. Currently only used for $new.
   *
   * @param {String} colId - The colId of the column to be removed.
   */
  removeColumn(colId: string) {
    this.trigger({ remove: { colIds: [colId] } });
  }
}

export type GridStore = Store & GridStoreImpl;
const configureStore = (options: GridStoreOptions) => {
  return Reflux.createStore(new GridStoreImpl(options)) as GridStore;
};

export default configureStore;
