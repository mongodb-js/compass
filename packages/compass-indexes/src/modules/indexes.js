const debug = require('debug')('mongodb-compass:modules:indexes');

import IndexModel from 'mongodb-index-model';
import map from 'lodash.map';
import max from 'lodash.max';
import { handleError } from './error';
import { localAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

/**
 * The module action prefix.
 */
const PREFIX = 'indexes';

/**
 * The loadIndexes action type.
 */
export const LOAD_INDEXES = `${PREFIX}/indexes/LOAD_INDEXES`;

/**
 * The sortIndexes action type.
 */
export const SORT_INDEXES = `${PREFIX}/indexes/SORT_INDEXES`;

/**
 * Default sortOrder
 */
export const DEFAULT = 'Name and Definition';
export const ASC = 'asc';
export const DESC = 'desc';
export const USAGE = 'Usage';

/**
 * The initial state.
 */
export const INITIAL_STATE = [];

/**
 * Get the comparator for properties.
 *
 * @param {Integer} order - The order.
 *
 * @returns {Function} The comparator function.
 */
const _propertiesComparator = (order) => {
  return function (a, b) {
    const aValue =
      a.cardinality === 'compound' ? 'compound' : a.properties[0] || '';
    const bValue =
      b.cardinality === 'compound' ? 'compound' : b.properties[0] || '';
    if (aValue > bValue) {
      return order;
    }
    if (aValue < bValue) {
      return -order;
    }
    return 0;
  };
};

/**
 * Get a comparator function for the sort.
 *
 * @param {String} field - The field to sort on.
 * @param {String} odr - The order.
 *
 * @returns {Function} The function.
 */
const _comparator = (field, odr) => {
  const order = odr === ASC ? 1 : -1;
  if (field === 'properties') {
    return _propertiesComparator(order);
  }
  return function (a, b) {
    if (a[field] > b[field]) {
      return order;
    }
    if (a[field] < b[field]) {
      return -order;
    }
    return 0;
  };
};

/**
 * Get the name of the field to sort on based on the column header.
 *
 * @param {String} f - The field.
 * @returns {String} The field.
 */
const _field = (f) => {
  if (f === DEFAULT) {
    return 'name';
  } else if (f === USAGE) {
    return 'usageCount';
  }
  return f.toLowerCase();
};

/**
 * Converts the raw index data to Index models and does calculations.
 *
 * @param {Array} indexes - The indexes.
 *
 * @returns {Array} The index models.
 */
const _convertToModels = (indexes) => {
  const maxSize = max(
    indexes.map((index) => {
      return index.size;
    })
  );
  return map(indexes, (index) => {
    const model = new IndexModel(new IndexModel().parse(index));
    model.relativeSize = (model.size / maxSize) * 100;
    return model;
  });
};

export const modelAndSort = (indexes, sortColumn, sortOrder) => {
  return _convertToModels(indexes).sort(
    _comparator(_field(sortColumn), sortOrder)
  );
};

/**
 * Data Service attaches string message property for some errors, but not all
 * that can happen during index creation/dropping. Check first for data service
 * custom error, then node driver errmsg, lastly use default error message.
 *
 * @param {Object} err - The error to parse a message from
 *
 * @returns {string} - The found error message, or the default message.
 */
export const parseErrorMsg = (err) => {
  if (typeof err.message === 'string') {
    return err.message;
  } else if (typeof err.errmsg === 'string') {
    return err.errmsg;
  }
  return 'Unknown error';
};

/**
 * Reducer function for handle state changes to indexes.
 *
 * @param {Array} state - The indexes state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SORT_INDEXES) {
    return [...action.indexes].sort(
      _comparator(_field(action.column), action.order)
    );
  } else if (action.type === LOAD_INDEXES) {
    return action.indexes;
  }
  return state;
}

/**
 * Action creator for load indexes events.
 *
 * @param {Array} indexes - The raw indexes list.
 *
 * @returns {Object} The load indexes action.
 */
export const loadIndexes = (indexes) => ({
  type: LOAD_INDEXES,
  indexes: indexes,
});

export const sortIndexes = (column, order) => {
  return (dispatch, getState) => {
    const { indexes } = getState();
    return dispatch({
      type: SORT_INDEXES,
      indexes,
      column,
      order,
    });
  };
};

/**
 * Load indexes from DB.
 *
 * @param {String} ns - The namespace.
 *
 * @returns {Function} The thunk function.
 */
export const loadIndexesFromDb = () => {
  return (dispatch, getState) => {
    const state = getState();
    if (state.isReadonly) {
      dispatch(loadIndexes([]));
      dispatch(localAppRegistryEmit('indexes-changed', []));
    } else if (state.dataService && state.dataService.isConnected()) {
      const ns = state.namespace;
      state.dataService.indexes(state.namespace, {}, (err, indexes) => {
        if (err) {
          dispatch(handleError(parseErrorMsg(err)));
          dispatch(loadIndexes([]));
          dispatch(localAppRegistryEmit('indexes-changed', []));
        } else {
          // Set the `ns` field manually as it is not returned from the server
          // since version 4.4.
          for (const index of indexes) {
            index.ns = ns;
          }
          const ixs = modelAndSort(indexes, state.sortColumn, state.sortOrder);
          dispatch(loadIndexes(ixs));
          dispatch(localAppRegistryEmit('indexes-changed', ixs));
        }
      });
    } else if (state.dataService && !state.dataService.isConnected()) {
      debug(
        'warning: trying to load indexes but dataService is disconnected',
        state.dataService
      );
    }
  };
};
