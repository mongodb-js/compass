/**
 * Action for the stats connection.
 */
const STATS_RECIEVED = 'import-export/stats/STATS_RECIEVED';

/**
 * The initial stats state.
 */
const INITIAL_STATE = {};

/**
 * Create a ns changed action.
 *
 * @param {Stats} stats - collection stats instance.
 *
 * @returns {Object} The action.
 */
const statsRecieved = stats => ({
  type: STATS_RECIEVED,
  stats
});


/**
 * Handle stats changes on the state.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === STATS_RECIEVED) {
    return action.stats;
  }
  return state;
};

export default reducer;
export {
  statsRecieved,
  STATS_RECIEVED
};
