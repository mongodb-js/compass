import type { Reducer } from 'redux';
import type { Document } from 'bson';

import { isAction } from './util';
import type { VectorEmbeddingVisualizerThunkAction } from './reducer';

export type VisualizationState = {
  loadingDocumentsState: 'initial' | 'loading' | 'loaded' | 'error';
  loadingDocumentsError: Error | null;
  docs: Document[];
};

export enum VisualizationActionTypes {
  FETCH_DOCUMENTS_STARTED = 'vector-embedding-visualizer/visualization/FETCH_DOCUMENTS_STARTED',
  FETCH_DOCUMENTS_SUCCESS = 'vector-embedding-visualizer/visualization/FETCH_DOCUMENTS_SUCCESS',
  FETCH_DOCUMENTS_FAILED = 'vector-embedding-visualizer/visualization/FETCH_DOCUMENTS_FAILED',
}

export type FetchDocumentsStartedAction = {
  type: VisualizationActionTypes.FETCH_DOCUMENTS_STARTED;
};

export type FetchDocumentsSuccessAction = {
  type: VisualizationActionTypes.FETCH_DOCUMENTS_SUCCESS;
  docs: Document[];
};

export type FetchDocumentsFailedAction = {
  type: VisualizationActionTypes.FETCH_DOCUMENTS_FAILED;
  error: Error;
};

export type VisualizationActions =
  | FetchDocumentsStartedAction
  | FetchDocumentsSuccessAction
  | FetchDocumentsFailedAction;

const INITIAL_STATE: VisualizationState = {
  loadingDocumentsState: 'initial',
  loadingDocumentsError: null,
  docs: [],
};

export const visualizationReducer: Reducer<VisualizationState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, VisualizationActionTypes.FETCH_DOCUMENTS_STARTED)) {
    return {
      ...state,
      loadingDocumentsState: 'loading',
      loadingDocumentsError: null,
    };
  }
  if (isAction(action, VisualizationActionTypes.FETCH_DOCUMENTS_SUCCESS)) {
    return {
      ...state,
      loadingDocumentsState: 'loaded',
      docs: action.docs,
    };
  }
  if (isAction(action, VisualizationActionTypes.FETCH_DOCUMENTS_FAILED)) {
    return {
      ...state,
      loadingDocumentsState: 'error',
      loadingDocumentsError: action.error,
    };
  }
  return state;
};

export function loadDocuments(
  namespace: string
): VectorEmbeddingVisualizerThunkAction<
  Promise<void>,
  | FetchDocumentsStartedAction
  | FetchDocumentsSuccessAction
  | FetchDocumentsFailedAction
> {
  return async (dispatch, getState, { dataService }) => {
    dispatch({
      type: VisualizationActionTypes.FETCH_DOCUMENTS_STARTED,
    });

    try {
      const docs = await dataService.find(namespace, {}, { limit: 1000 });

      dispatch({
        type: VisualizationActionTypes.FETCH_DOCUMENTS_SUCCESS,
        docs,
      });
    } catch (err) {
      dispatch({
        type: VisualizationActionTypes.FETCH_DOCUMENTS_FAILED,
        error: err as Error,
      });
    }
  };
}
