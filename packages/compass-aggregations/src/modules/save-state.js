// import Nanoidb from 'nanoidb';

/**
 * constant for saving current state
 */
export const SAVE_STATE = 'aggregations/save-state';

/**
 * constant for restoring previous state
 */
export const RESTORE_STATE = 'aggregations/restore-state';

/**
 * constant for indexeddb object store
 */
// const SAVED_STATE_OBJECT_STORE = 'aggregation-pipeline-plugin-saved-state';

/**
 * constant for indexeddb object store
 */
// const INDEXED_DB = 'aggregation-pipeline-plugin';

/**
 * @param {Object} state - current state
 *
 * @returns {object} state - adjusted copy of the current state for indexeddb
 * to save
 */
export const saveState = (state) => {
  return Object.assign({}
    , { inputDocuments: state.inputDocuments }
    , { savedPipelines: state.savedPipelines }
    , { namespace: state.namespace }
    , { stages: state.stages }
    , { view: state.view }
  );

  // const db = Nanoidb(INDEXED_DB, 1);

  // db.on('upgrade', (diffdata) => {
  //   diffdata.db.createobjectstore(SAVED_STATE_OBJECT_STORE);
  // });

  // db.on('open', (stores) => {
  //   putOp(stores.SAVED_STATE_OBJECT_STORE);

  //   function putOp (store) {
  //     store.put('key', stateRecord, (err) => {
  //       if (err) console.log(err);
  //       // how do we store/handle errors?
  //       console.log('written a thing!');
  //     });
  //   }
  // });
};

/**
 * Given stateId, query indexeddb and get the current state object
 * @param {Object} state - current state
 * @param {string} stateId - the id of the state you want to restore
 *
 * @returns {object} state - adjusted copy of the current state for indexeddb
 * to save
 */
export const restoreState = (state, stateId) => {
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
};

/**
 * Save the current state of your pipeline
 *
 * @returns {Object} The action.
 */
export const saveStateCreator = () => ({
  type: SAVE_STATE
});

/**
 * Restore the state we get from indexeddb
 *
 * @param {string} stateId - key to retrieve the object from indexeddb
 *
 * @returns {Object} The action.
 */
export const restoreStateCreator = (stateId) => ({
  type: RESTORE_STATE,
  stateId: stateId
});
