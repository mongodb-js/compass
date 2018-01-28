/**
 * The prefix.
 */
const PREFIX = 'aggregations/results';

/**
 * The pipeline errored.
 */
export const RESULTS_ERRORED = `${PREFIX}/results-errored`;

/**
 * The pipeline succeeded.
 */
export const RESULTS_FETCHED = `${PREFIX}/results-fetched`;

/**
 * The aggregation options.
 */
export const OPTIONS = Object.freeze({ promoteValues: false });

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  error: null,
  docs: []
};

/**
 * Execute the pipeline.
 *
 * @param {Object} state - The state.
 * @param {Function} done - The callback.
 */
export const execute = (state, done) => {
  const dataService = state.dataService.dataService;
  dataService.aggregate(state.namespace, [], OPTIONS, (error, cursor) => {
    if (error) {
      return done(error);
    }
    // @todo: Get pagination information from the state.
    // @todo: How do we get the count?
    cursor.toArray(done);
  });
};

/**
 * Reducer function for handling pipeline results.
 *
 * @param {Object} state - The results state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === RESULTS_ERRORED) {
    return {
      error: action.error,
      docs: []
    };
  } else if (action.type === RESULTS_FETCHED) {
    return {
      error: null,
      docs: action.docs
    };
  }
  return state;
}

/**
 * Action creator for when the pipeline errors.
 *
 * @param {Error} error - The error.
 *
 * @returns {Object} The pipeline errored action.
 */
export const resultsErrored = (error) => ({
  type: RESULTS_ERRORED,
  error: error
});

/**
 * Action creator for when results were fetched.
 *
 * @param {Array} docs - The documents.
 *
 * @returns {Object} The results fetched action.
 */
export const resultsFetched = (docs) => ({
  type: RESULTS_FETCHED,
  docs: docs
});

/**
 * Action creator to execute a pipeline.
 *
 * @returns {Function} The copy to clipboard function.
 */
export const executePipeline = () => {
  return (dispatch, getState) => {
    execute(getState(), (error, docs) => {
      if (error) {
        return dispatch(resultsErrored(error));
      }
      return dispatch(resultsFetched(docs));
    });
  };
};
