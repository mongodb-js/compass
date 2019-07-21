/**
 * Create is genuine MongoDB action.
 */
export const TOGGLE_IS_GENUINE_MONGODB = 'sidebar/is-genuine-mongodb/TOGGLE_IS_GENUINE_MONGODB';

/**
 * The initial state of the instance header is genuine MongoDB.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state toggles to instance header is genuine MongoDB.
 *
 * @param {String} state - The instance header is genuine MongoDB state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_GENUINE_MONGODB) {
    return action.isGenuineMongoDB;
  }
  return state;
}

/**
 * The toggle is genuine MongoDB action creator.
 *
 * @param {Boolean} isGenuineMongoDB - The isGenuineMongoDB.
 *
 * @returns {Object} The action.
 */
export const toggleIsGenuineMongoDB = (isGenuineMongoDB) => ({
  type: TOGGLE_IS_GENUINE_MONGODB,
  isGenuineMongoDB: isGenuineMongoDB
});
