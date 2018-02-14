// import { SAVED_STATE_OBJECT_STORE, INDEXED_DB } from './save-state';
// import Nanoidb from 'nanoidb';

/**
 * constant for restoring previous state
 */
export const RESTORE_STATE = 'aggregations/restore-state';

/**
 * Given stateId, query indexeddb and get the current state object
 * @param {Object} state - current state
 * @param {string} stateId - the id of the state you want to restore
 *
 * @returns {object} state - adjusted copy of the current state for indexeddb
 * to save
 */
export default function reducer(state, stateId) {
  // this is what the object would look like as we get it from indexeddb
  const saved = {
    inputDocuments: {},
    savedPipelines: {},
    namespace: {},
    stages: {},
    view: '',
    stateId: stateId
  };

  return Object.assign({}, state, saved);
}

/**
 * Restore the state we get from indexeddb
 *
 * @param {string} stateId - key to retrieve the object from indexeddb
 *
 * @returns {Object} The action.
 */
export const restoreState = (stateId) => ({
  type: RESTORE_STATE,
  stateId: stateId
});
