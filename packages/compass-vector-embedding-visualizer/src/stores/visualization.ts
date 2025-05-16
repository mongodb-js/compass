import type { Reducer } from 'redux';
import type { Document } from 'bson';
import { Binary } from 'mongodb';

import { isAction } from './util';
import type { VectorEmbeddingVisualizerThunkAction } from './reducer';
import { VectorDataService } from './store';
import { VoyageAIClient } from 'voyageai'; // Adjust import as needed

export type VisualizationState = {
  loadingDocumentsState: 'initial' | 'loading' | 'loaded' | 'error';
  loadingDocumentsError: Error | null;
  docs: Document[];
  aggResults: { candidates: Document[]; limited: Document[] };
};

export enum VisualizationActionTypes {
  FETCH_DOCUMENTS_STARTED = 'vector-embedding-visualizer/visualization/FETCH_DOCUMENTS_STARTED',
  FETCH_DOCUMENTS_SUCCESS = 'vector-embedding-visualizer/visualization/FETCH_DOCUMENTS_SUCCESS',
  FETCH_DOCUMENTS_FAILED = 'vector-embedding-visualizer/visualization/FETCH_DOCUMENTS_FAILED',
  FETCH_AGG_STARTED = 'vector-embedding-visualizer/visualization/FETCH_AGG_STARTED',
  FETCH_AGG_SUCCESS = 'vector-embedding-visualizer/visualization/FETCH_AGG_SUCCESS',
  FETCH_AGG_FAILED = 'vector-embedding-visualizer/visualization/FETCH_AGG_FAILED',
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

export type FetchAggStartedAction = {
  type: VisualizationActionTypes.FETCH_AGG_STARTED;
};

export type FetchAggSuccessAction = {
  type: VisualizationActionTypes.FETCH_AGG_SUCCESS;
  aggResults: { candidates: Document[]; limited: Document[] };
};

export type FetchAggFailedAction = {
  type: VisualizationActionTypes.FETCH_AGG_FAILED;
  error: Error;
};

export type VisualizationActions =
  | FetchDocumentsStartedAction
  | FetchDocumentsSuccessAction
  | FetchDocumentsFailedAction
  | FetchAggStartedAction
  | FetchAggSuccessAction
  | FetchAggFailedAction;

const INITIAL_STATE: VisualizationState = {
  loadingDocumentsState: 'initial',
  loadingDocumentsError: null,
  docs: [],
  aggResults: { candidates: [], limited: [] },
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
  if (isAction(action, VisualizationActionTypes.FETCH_AGG_STARTED)) {
    return {
      ...state,
      loadingDocumentsError: null,
    };
  }
  if (isAction(action, VisualizationActionTypes.FETCH_AGG_SUCCESS)) {
    return {
      ...state,
      aggResults: action.aggResults,
    };
  }
  if (isAction(action, VisualizationActionTypes.FETCH_AGG_FAILED)) {
    return {
      ...state,
      loadingDocumentsError: action.error,
    };
  }
  return state;
};

export function loadDocuments(): VectorEmbeddingVisualizerThunkAction<
  Promise<void>,
  | FetchDocumentsStartedAction
  | FetchDocumentsSuccessAction
  | FetchDocumentsFailedAction
> {
  return async function fetchDocs(
    dispatch,
    getState,
    { dataService, collection }
  ) {
    dispatch({
      type: VisualizationActionTypes.FETCH_DOCUMENTS_STARTED,
    });

    try {
      const docs = await dataService.find(
        `${collection.database}.${collection.name}`,
        {},
        { limit: 1000 }
      );

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

//@ts-expect-error: I knowwwwww
globalThis.vectorCache = new Map<string, Binary>();

async function r(
  ns: string,
  collection: VectorDataService,
  query: string,
  numCandidates: number,
  limit: number
) {
  const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGEAI_API_KEY });

  // Try to get vector from cache
  //@ts-expect-error: I knowwwwww
  let vector = globalThis.vectorCache.get(query);

  if (vector == null) {
    // Get vector from VoyageAI
    console.log('Fetching vector from VoyageAI');
    const response = await voyage.embed({
      model: 'voyage-3-large',
      input: query,
    });

    if (
      response.data == null ||
      response.data[0] == null ||
      response.data[0].embedding == null
    ) {
      throw new Error('No vector found');
    }
    vector = Binary.fromFloat32Array(
      new Float32Array(response.data[0].embedding)
    );

    // Cache the vector for future use

    //@ts-expect-error: I knowwwwww
    globalThis.vectorCache.set(query, vector);
  } else {
    console.log('Fetching vector from Cache');
  }

  // Run vector search aggregation
  const pipeline = (numCandidates: number, limit: number) => [
    {
      $vectorSearch: {
        index: 'real_for_real_index',
        path: 'review_vec',
        queryVector: vector,
        numCandidates,
        limit,
      },
    },
  ];

  const candidates = await collection.aggregate(
    ns,
    pipeline(numCandidates, numCandidates)
  );

  const limited = await collection.aggregate(
    ns,
    pipeline(numCandidates, limit)
  );

  return { candidates, limited };
}

export function runVectorAggregation(): VectorEmbeddingVisualizerThunkAction<
  Promise<void>,
  FetchAggStartedAction | FetchAggSuccessAction | FetchAggFailedAction
> {
  return async function fetchAggregation(
    dispatch,
    getState,
    { dataService, collection }
  ) {
    dispatch({
      type: VisualizationActionTypes.FETCH_AGG_STARTED,
    });

    try {
      console.log('Running vector aggregation');
      const aggResults = await r(
        `${collection.database}.${collection.name}`,
        dataService,
        'funny',
        100,
        10
      );
      console.log(
        'Aggregation results:',
        aggResults.candidates.slice(0, 10),
        aggResults.limited.slice(0, 10)
      );
      dispatch({
        type: VisualizationActionTypes.FETCH_AGG_SUCCESS,
        aggResults,
      });
    } catch (err) {
      dispatch({
        type: VisualizationActionTypes.FETCH_AGG_FAILED,
        error: err as Error,
      });
    }
  };
}
