import type { Document } from 'mongodb';
import type { AnyAction } from 'redux';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import { PipelineBuilderThunkAction } from '.';
const debug = require('debug')('mongodb-aggregations:modules:input-document');

export enum ActionTypes {
  CollapseToggled = 'aggregations/input-documents/CollapseToggled',
  DocumentsFetchStarted = 'aggregations/input-documents/DocumentsFetchStarted',
  DocumentsFetchFinished = 'aggregations/input-documents/DocumentsFetchFinished',
};

type CollapseToggledAction = {
  type: ActionTypes.CollapseToggled;
};

type DocumentsFetchStartedAction = {
  type: ActionTypes.DocumentsFetchStarted;
};

type DocumentsFetchFinishedAction = {
  type: ActionTypes.DocumentsFetchFinished;
  count: number | null;
  documents: Document[];
  error: Error | null;
};

type State = {
  count: number | null;
  documents: Document[];
  error: Error | null;
  isExpanded: boolean;
  isLoading: boolean;
};

export const INITIAL_STATE: State = {
  count: null,
  documents: [],
  error: null,
  isExpanded: true,
  isLoading: false
};

const reducer = (state = INITIAL_STATE, action: AnyAction) => {
  if (action.type === ActionTypes.CollapseToggled) {
    return { ...state, isExpanded: !state.isExpanded };
  }
  
  if (action.type === ActionTypes.DocumentsFetchStarted) {
    return { ...state, isLoading: true };
  }
  
  if (action.type === ActionTypes.DocumentsFetchFinished) {
    return {
      ...state,
      count: action.count,
      documents: action.documents,
      error: action.error,
      isLoading: false
    };
  }
  return state;
};

export default reducer;

export const toggleInputDocumentsCollapsed = (): CollapseToggledAction => ({
  type: ActionTypes.CollapseToggled
});


export const loadingInputDocuments = (): DocumentsFetchStartedAction => ({
  type: ActionTypes.DocumentsFetchStarted
});

export const updateInputDocuments = (
  count: number | null,
  documents: Document[],
  error: Error | null
): DocumentsFetchFinishedAction => ({
  type: ActionTypes.DocumentsFetchFinished,
  count,
  documents,
  error,
});

export const refreshInputDocuments = (): PipelineBuilderThunkAction<void> => {
  return async (dispatch, getState) => {
    const {
      dataService: { dataService },
      namespace: ns,
      maxTimeMS,
      settings: {
        sampleSize
      }
    } = getState();

    if (!dataService) {
      return;
    }

    if (dataService && !dataService.isConnected()) {
      debug(
        'warning: trying to refresh aggregation but dataService is disconnected',
        dataService
      );
    }

    const options = {
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(maxTimeMS) as number | undefined
    };

    const exampleDocumentsPipeline = [{ $limit: sampleSize }];

    dispatch(loadingInputDocuments());

    try {
      const data = await Promise.allSettled([
        dataService.estimatedCount(ns, options),
        dataService.aggregate(ns, exampleDocumentsPipeline, options)
      ]);

      const count = data[0].status === 'fulfilled' ? data[0].value : null;
      const docs = data[1].status === 'fulfilled' ? data[1].value : [];

      const error = data[0].status === 'rejected'
        ? data[0].reason
        : data[1].status === 'rejected'
        ? data[1].reason
        : null;
      dispatch(updateInputDocuments(count, docs, error));
    } catch (error) {
      dispatch(updateInputDocuments(null, [], error as Error));
    }
  };
};
