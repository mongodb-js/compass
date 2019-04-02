import ExplainPlanModel from 'mongodb-explain-plan-model';
import { defaults, isString, find } from 'lodash';
import { treeStagesChanged } from 'modules/tree-stages';
import { appRegistryEmit } from 'modules/app-registry';

/**
 * The module action prefix.
 */
const PREFIX = 'explain';

/**
 * Switched to tree view action name.
 */
export const SWITCHED_TO_TREE_VIEW = `${PREFIX}/SWITCHED_TO_TREE_VIEW`;

/**
 * Switched to JSON view action name.
 */
export const SWITCHED_TO_JSON_VIEW = `${PREFIX}/SWITCHED_TO_JSON_VIEW`;

/**
* The explainState changed action name.
*/
export const EXPLAIN_STATE_CHANGED = `${PREFIX}/EXPLAIN_STATE_CHANGED`;

/**
* The explain plan fetched action name.
*/
export const EXPLAIN_PLAN_FETCHED = `${PREFIX}/EXPLAIN_PLAN_FETCHED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  explainState: 'initial',
  viewType: 'tree',
  error: null,
  executionSuccess: false,
  executionTimeMillis: 0,
  inMemorySort: false,
  isCollectionScan: false,
  isCovered: false,
  isMultiKey: false,
  isSharded: false,
  indexType: 'UNAVAILABLE',
  index: null,
  nReturned: 0,
  namespace: '',
  numShards: 0,
  parsedQuery: {},
  rawExplainObject: {},
  totalDocsExamined: 0,
  totalKeysExamined: 0,
  usedIndex: null
};

/**
 * Switches the view type.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const switchViewType = (state, action) => ({
  ...state,
  viewType: action.viewType
});

/**
 * Changes explainState.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doChangeExplainPlanState = (state, action) => {
  let explainState = state.explainState;

  if (action.explainState === 'initial') {
    return INITIAL_STATE;
  }

  explainState = action.explainState;

  return { ...state, explainState };
};

/**
 * Executes explain plan.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const executeExplainPlan = (state, action) => ({ ...state, ...action.explain });

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {
  [SWITCHED_TO_TREE_VIEW]: switchViewType,
  [SWITCHED_TO_JSON_VIEW]: switchViewType,
  [EXPLAIN_STATE_CHANGED]: doChangeExplainPlanState,
  [EXPLAIN_PLAN_FETCHED]: executeExplainPlan
};

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

/**
 * Action creator for switch to tree view events.
 *
 * @returns {Object} Switched to tree view action.
 */
export const switchToTreeView = () => ({
  type: SWITCHED_TO_TREE_VIEW,
  viewType: 'tree'
});

/**
 * Action creator for switch to JSON view events.
 *
 * @returns {Object} Switched to JSON view action.
 */
export const switchToJSONView = () => ({
  type: SWITCHED_TO_JSON_VIEW,
  viewType: 'json'
});

/**
 * Action creator for explainState changed events.
 *
 * @param {String} explainState - The explain state.
 *
 * @returns {Object} The explainState changed action.
 */
export const explainStateChanged = (explainState) => ({
  type: EXPLAIN_STATE_CHANGED,
  explainState
});

/**
* Action creator for the explain plan fetched events.
*
* @param {Object} explain - The explain plan.
*
* @returns {Object} The explain plan fetched action.
*/
export const explainPlanFetched = (explain) => ({
  type: EXPLAIN_PLAN_FETCHED,
  explain: { ...explain, explainState: 'done' }
});

/**
 * Gets index type.
 *
 * @param {Object} explainPlan - The explain plan.
 *
 * @returns {String} The index type.
 */
const getIndexType = (explainPlan) => {
  if (!explainPlan) {
    return 'UNAVAILABLE';
  }
  if (Array.isArray(explainPlan.usedIndex)) {
    return 'MULTIPLE';
  }
  if (explainPlan.isCollectionScan) {
    return 'COLLSCAN';
  }

  if (explainPlan.isCovered) {
    return 'COVERED';
  }

  return 'INDEX';
};

/**
 * Parses the explain plan.
 *
 * @param {Object} explain - The explain plan.
 *
 * @returns {Object} The parsed explain plan.
 */
const parseExplainPlan = (explain) => {
  const explainPlanModel = new ExplainPlanModel(explain);

  return defaults(explainPlanModel.serialize(), INITIAL_STATE);
};

/**
 * Updates the explain plan with information about indexes.
 * Extracts index type, index object
 *
 * @param {Object} explain - The explain plan.
 * @param {Array} indexes - Indexes received from indexes plugin.
 *
 * @returns {Object} The updated explain plan with indexes info.
 */
const updateWithIndexesInfo = (explain, indexes) => ({
  ...explain,
  indexType: getIndexType(explain),
  index: isString(explain.usedIndex)
    ? find(indexes, (idx) => (idx.name === explain.usedIndex))
    : null
});

/**
 * Fetches the explain plan.
 *
 * @returns {Function} The function.
 */
export const fetchExplainPlan = () => {
  return (dispatch, getState) => {
    const state = getState();
    let explain = state.explain;

    if (explain.explainState === 'initial') {
      return;
    }

    if (explain.explainState !== 'fetching') {
      return dispatch(explainStateChanged('outdated'));
    }

    const dataService = state.dataService.dataService;
    const namespace = state.namespace.ns;
    const query = state.query;
    const indexes = state.indexes;
    const filter = query.filter;
    const options = {
      sort: query.sort,
      projection: query.project,
      skip: query.skip,
      limit: query.limit
    };

    if (query.collation) {
      options.collation = query.collation;
    }

    if (dataService) {
      dataService.explain(namespace, filter, options, (error, data) => {
        if (error) {
          explain.error = error;

          return dispatch(explainPlanFetched(explain));
        }

        explain = parseExplainPlan(data);
        explain = updateWithIndexesInfo(explain, indexes);

        dispatch(explainPlanFetched(explain));
        dispatch(treeStagesChanged(explain));

        // Send metrics
        dispatch(appRegistryEmit(
          'explain-plan-fetched',
          {
            viewMode: explain.viewType,
            executionTimeMS: explain.executionTimeMillis,
            inMemorySort: explain.inMemorySort,
            isCollectionScan: explain.isCollectionScan,
            isCovered: explain.isCovered,
            isMultiKey: explain.isMultiKey,
            isSharded: explain.isSharded,
            indexType: explain.indexType,
            index: explain.index ? explain.index.serialize() : null,
            numberOfDocsReturned: explain.nReturned,
            numberOfShards: explain.numShards,
            totalDocsExamined: explain.totalDocsExamined,
            totalKeysExamined: explain.totalKeysExamined,
            indexUsed: explain.usedIndex
          }
        ));

        return;
      });
    }
  };
};

/**
 * Changes the explain plan state.
 *
 * @param {String} explainState - The explain plan state.
 *
 * @returns {Function} The function.
 */
export const changeExplainPlanState = (explainState) => {
  return (dispatch) => {
    dispatch(explainStateChanged(explainState));
    dispatch(fetchExplainPlan());

    return;
  };
};
