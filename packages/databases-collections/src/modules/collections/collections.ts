import type { AnyAction } from 'redux';
import type Collection from 'mongodb-collection-model';

import { CHANGE_DATABASE_NAME } from '../database-name';

/**
 * The module prefix.
 */
const PREFIX = 'databases-collections/collections';

/**
 * The load collections action name.
 */
export const SET_COLLECTIONS = `${PREFIX}/SET_COLLECTIONS`;

/**
 * The initial state of the collections attribute.
 */
export const INITIAL_STATE: Collection[] = [];

/**
 * Reducer function for handle state changes to collections.
 *
 * @param {Array} state - The collections state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): Collection[] {
  switch (action.type) {
    case SET_COLLECTIONS:
    case CHANGE_DATABASE_NAME:
      return action.collections;
    default:
      return state;
  }
}

/**
 * Action creator for load collections events.
 */
export const setCollections = (collections: Collection[]) => ({
  type: SET_COLLECTIONS,
  collections: collections,
});
