/**
 * Create data service.
 */
export const CHANGE_DATA_SERVICE = 'app/instance/CHANGE_DATA_SERVICE';

/**
 * The initial state of the data service.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to data service.
 *
 * @param {String} state - The data service state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_DATA_SERVICE) {
    return action.dataService;
  }
  return state;
}

/**
 * The change data service action creator.
 *
 * @param {String} dataService - The dataService.
 *
 * @returns {Object} The action.
 */
export const changeDataService = (dataService) => ({
  type: CHANGE_DATA_SERVICE,
  dataService: dataService
});
