import type { AnyAction } from 'redux';
import type {
  VectorEmbeddingVisualizerActions,
  VectorEmbeddingVisualizerActionTypes,
} from './reducer';

export function isAction<T extends VectorEmbeddingVisualizerActionTypes>(
  action: AnyAction,
  type: T
): action is Extract<VectorEmbeddingVisualizerActions, { type: T }> {
  return action.type === type;
}
