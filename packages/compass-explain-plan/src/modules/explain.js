/**
 * View types.
 */
// const VIEW_TYPES = ['tree', 'json'];

/**
 * Index types.
 */
// const INDEX_TYPES = ['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN', 'COVERED', 'INDEX'];

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  viewType: 'tree',
  rawExplainObject: {},
  nReturned: 0,
  totalKeysExamined: 0,
  totalDocsExamined: 0,
  executionTimeMillis: 0,
  inMemorySort: false,
  indexType: 'UNAVAILABLE',
  index: null
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {};

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];

  return fn ? fn(state, action) : state;
}
