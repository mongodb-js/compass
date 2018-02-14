const Nanoidb = require('nanoidb');
const BSON = require('bson');

/**
 * constant for saving current state
 */
export const SAVE_STATE = 'aggregations/save-state';

/**
 * constant for indexeddb object store
 */
export const SAVED_STATE_OBJECT_STORE = 'aggregation-pipeline-plugin-saved-state';

/**
 * constant for indexeddb object store
 */
export const INDEXED_DB = 'aggregation-pipeline-plugin';

/**
 * @param {Object} state - current state
 *
 * @return {Object} state - since we are not modifying the current state, just
 * return whatever the state we are passed
 */
export default function reducer(state) {
  const stateRecord = Object.assign({}
    , { inputDocuments: state.inputDocuments }
    , { savedPipelines: state.savedPipelines }
    , { namespace: state.namespace }
    , { stages: state.stages }
    , { view: state.view }
  );

  const db = Nanoidb(INDEXED_DB, 1);

  const ObjectID = BSON.ObjectID;
  const key = ObjectID(100).toHexString();

  db.on('upgrade', (diffData) => {
    diffData.db.createObjectStore(SAVED_STATE_OBJECT_STORE);
  });

  db.on('open', (stores) => {
    putOp(stores[SAVED_STATE_OBJECT_STORE]);

    function putOp(store) {
      store.put(key, stateRecord, (err) => {
        // how do we store/handle errors?
        if (err) return console.log(err);
        // how do we handle success messages
        return console.log('written a thing!');
      });
    }
  });

  return state;
}

/**
 * Save the current state of your pipeline
 *
 * @returns {Object} The action.
 */
export const saveState = () => ({
  type: SAVE_STATE
});
