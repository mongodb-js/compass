import { appRegistryEmit } from 'modules/app-registry';

/**
 * Zero state changed action.
 */
export const IS_ZERO_STATE_CHANGED = 'validation/namespace/IS_ZERO_STATE_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to namespace.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === IS_ZERO_STATE_CHANGED) {
    return action.isZeroState;
  }

  return state;
}

/**
 * Action creator for zero state changed events.
 *
 * @returns {Object} The zero state changed action.
 */
export const zeroStateChanged = () => ({
  type: IS_ZERO_STATE_CHANGED,
  isZeroState: false
});

/**
 * Send metrics.
 *
 * @param {Function} dispatch - Dispatch.
 * @param {Object} dataService - Data service.
 * @param {Object} namespace - Namespace.
 * @param {String} registryEvent - Registry event.
 *
 * @returns {Function} The function.
 */
const sendMetrics = (dispatch, dataService, namespace, registryEvent) => dataService
  .database(namespace.database, {}, (errorDB, res) => {
    let collectionSize = 0;

    if (!errorDB) {
      const collection = res.collections.find((coll) => (
        coll.name === namespace.collection
      ));

      collectionSize = collection.document_count;
    }

    return dispatch(appRegistryEmit(registryEvent, { collectionSize } ));
  });

/**
* Change zero state.
*
* @returns {Function} The function.
*/
export const changeZeroState = () => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;
    const namespace = state.namespace;

    sendMetrics(dispatch, dataService, namespace, 'schema-validation-rules-added');
    dispatch(zeroStateChanged());

    return;
  };
};
