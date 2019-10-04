/**
 * The collection stats displayed in the <ExportModal />.
 */

const STATS_RECEIVED = 'import-export/stats/STATS_RECEIVED';

const INITIAL_STATE = {};

const statsReceived = stats => ({
  type: STATS_RECEIVED,
  stats
});

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
