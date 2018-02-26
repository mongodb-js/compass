/**
 * Action for the stats connection.
 */
const STATS_RECEIVED = 'import-export/stats/STATS_RECEIVED';

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
const statsReceived = stats => ({
  type: STATS_RECEIVED,
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
  if (action.type === STATS_RECEIVED) {
    return action.stats;
  }
  return state;
};

export default reducer;
export {
  statsReceived,
  STATS_RECEIVED
};
