import type { AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type {
  VisualizationActions,
  VisualizationActionTypes,
} from './visualization';
import type { ThunkAction } from 'redux-thunk';
import { visualizationReducer } from './visualization';
import type { VectorPluginServices } from './store';

const reducer = combineReducers({
  visualization: visualizationReducer,
});

export type VectorEmbeddingVisualizerActions = VisualizationActions;

export type VectorEmbeddingVisualizerActionTypes = VisualizationActionTypes;

export type VectorEmbeddingVisualizerState = ReturnType<typeof reducer>;

export type VectorEmbeddingVisualizerExtraArgs = VectorPluginServices & {
  cancelControllerRef: { current: AbortController | null };
};

export type VectorEmbeddingVisualizerThunkAction<
  R,
  A extends AnyAction
> = ThunkAction<
  R,
  VectorEmbeddingVisualizerState,
  VectorEmbeddingVisualizerExtraArgs,
  A
>;

export default reducer;
