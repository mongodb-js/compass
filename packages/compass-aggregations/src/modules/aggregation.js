import isEmpty from 'lodash.isempty';
import parser from 'ejson-shell-parser';
import { ObjectId } from 'bson';

import { DEFAULT_MAX_TIME_MS } from '../constants';
import { stagesAdded } from './pipeline';

const PREFIX = 'aggregations/no-stage';
export const FULLSCREEN_TOGGLE = `${PREFIX}/FULLSCREEN_TOGGLE`;
export const INVALID_QUERY = `${PREFIX}/INVALID_QUERY`;
export const DOCUMENTS_FETCHED = `${PREFIX}/DOCUMENTS_FETCHED`;
export const LOADING_CHANGED = `${PREFIX}/LOADING_CHANGED`;
export const QUERY_UPDATED = `${PREFIX}/QUERY_UPDATED`;

/**
  * The initial state.
  */
export const INITIAL_STATE = {
  isEnabled: false,
  query: JSON.stringify([], null, 2),
  documents: [],
  loading: false,
  errorMessage: null,
};

/**
  * The reducer.
  *
  * @param {Boolean} state The state.
  * @param {Object} action The action.
  *
  * @returns {Boolean} The state.
  */
export default function reducer(state = INITIAL_STATE, action) {
  const newState = {...state};
  if (action.type === FULLSCREEN_TOGGLE) {
    newState.isEnabled = action.isEnabled;
  }
  if (action.type === INVALID_QUERY) {
    newState.errorMessage = action.message;
    newState.loading = false;
    newState.documents = [];
  }
  if (action.type === DOCUMENTS_FETCHED) {
    newState.errorMessage = null;
    newState.loading = false;
    newState.documents = action.documents;
  }
  if (action.type === LOADING_CHANGED) {
    newState.loading = action.loading;
  }
  if (action.type === QUERY_UPDATED) {
    newState.query = action.query;
  }

  return newState;
}

const viewToggled = (value) => ({
  type: FULLSCREEN_TOGGLE,
  isEnabled: !!value
});

const invalidAggregationQueryExecuted = (message) => ({
  type: INVALID_QUERY,
  message,
});

const updateLoading = (loading) => ({
  type: LOADING_CHANGED,
  loading,
});

const documentsFetched = (documents) => ({
  type: DOCUMENTS_FETCHED,
  documents,
});

const queryUpdated = (query) => ({
  type: QUERY_UPDATED,
  query,
});

/**
  * @param {Boolean} isAggregationView - Is the full aggregation view.
  *
  * @returns {Object} The action.
  */
export const toggleAggregationView = (isAggregationView) => {
  return (dispatch, getState) => {
    const { pipeline, noStageAggregation } = getState();
    if (isAggregationView) {
      dispatch(queryUpdated(convertStagesToAggregationQuery(pipeline)));
    } else {
      dispatch(stagesAdded(convertAggregationQueryToStages(noStageAggregation.query)));
    }
    dispatch(viewToggled(isAggregationView));
  };
};

export const runAggregation = (query) => {
  return (dispatch, getState) => {
    const parsedQuery = parser(query);
    if (parsedQuery === '' && query !== '') {
      return dispatch(invalidAggregationQueryExecuted('Invalid aggregation pipeline'));
    }

    dispatch(queryUpdated(query));
    dispatch(updateLoading(true));
    const {
      dataService: { dataService },
      maxTimeMS,
      collation,
      namespace,
    } = getState();

    const options = {
      maxTimeMS: maxTimeMS || DEFAULT_MAX_TIME_MS,
      allowDiskUse: true
    };

    if (!isEmpty(collation)) {
      options.collation = collation;
    }

    dataService.aggregate(namespace, parsedQuery, options, (err, cursor) => {
      if (err) {
        return dispatch(invalidAggregationQueryExecuted(err.message));
      }
      cursor.toArray((e, docs) => {
        cursor.close();
        if (e) {
          return dispatch(invalidAggregationQueryExecuted(e.message));
        }
        dispatch(documentsFetched(docs));
      });
    });
  };
};

const convertStagesToAggregationQuery = (stages) => {
  return JSON.stringify(stages.filter(x => x.stageOperator).map(x => ({
    [x.stageOperator]: parser(x.stage)
  })), null, 2);
};

const convertAggregationQueryToStages = (aggregation) => {
  const parsedAggregation = parser(aggregation);
  if (parsedAggregation === '') {
    return;
  }
  return parsedAggregation.map((stage) => ({
    id: new ObjectId().toHexString(),
    stageOperator: Object.keys(stage)[0],
    stage: JSON.stringify(Object.values(stage)[0]),
    isValid: true,
    isEnabled: true,
    isExpanded: true,
    isLoading: false,
    isComplete: false,
    previewDocuments: [],
    syntaxError: null,
    error: null,
    projections: []
  }));
};
