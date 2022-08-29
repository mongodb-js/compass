import type { AnyAction } from 'redux';
import type { CreateIndexSpec } from './create-index';
import type { IndexFieldsDefinition } from './indexes';

/**
 * In progress indexes added action name.
 */
export const IN_PROGRESS_INDEXES_ADDED =
  'indexes/in-progress-indexes/IN_PROGRESS_INDEXES_ADDED';

/**
 * In progress indexes removed action name.
 */
export const IN_PROGRESS_INDEXES_REMOVED =
  'indexes/in-progress-indexes/IN_PROGRESS_INDEXES_REMOVED';

/**
 * In progress indexes failed action name.
 */
export const IN_PROGRESS_INDEXES_FAILED =
  'indexes/in-progress-indexes/IN_PROGRESS_INDEXES_FAILED';

export type InProgressIndex = {
  id: string;
  status: 'inprogress' | 'failed';
  key: CreateIndexSpec;
  fields: IndexFieldsDefinition[];
  name: string;
  ns: string;
  size: number;
  relativeSize: number;
  usageCount: number;
};

/**
 * The initial state of the in progress indexes.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle the in progress indexes state changes.
 *
 * @param state - The in progress index state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === IN_PROGRESS_INDEXES_ADDED) {
    return [...state, action.inProgressIndex];
  }
  if (action.type === IN_PROGRESS_INDEXES_REMOVED) {
    return [
      ...state.filter(
        (item: InProgressIndex) => item.id !== action.inProgressIndexId
      ),
    ];
  }
  if (action.type === IN_PROGRESS_INDEXES_FAILED) {
    const newState = [...state];
    const idx = newState.findIndex(
      (item: InProgressIndex) => item.id === action.inProgressIndexId
    );
    const failedIndex: InProgressIndex = newState[idx];
    failedIndex.status = 'failed';
    return newState;
  }
  return state;
}

/**
 * Action creator for the in progress index added event.
 *
 * @param inProgressIndexes - The in progress index.
 *
 * @returns The action.
 */
export const inProgressIndexAdded = (inProgressIndex: any) => ({
  type: IN_PROGRESS_INDEXES_ADDED,
  inProgressIndex,
});

/**
 * Action creator for the in progress index removed event.
 *
 * @param inProgressIndexId - The in progress index id.
 *
 * @returns The action.
 */
export const inProgressIndexRemoved = (inProgressIndexId: string) => ({
  type: IN_PROGRESS_INDEXES_REMOVED,
  inProgressIndexId,
});

/**
 * Action creator for the in progress index failed event.
 *
 * @param inProgressIndexId - The in progress index id.
 *
 * @returns The action.
 */
export const inProgressIndexFailed = (inProgressIndexId: string) => ({
  type: IN_PROGRESS_INDEXES_FAILED,
  inProgressIndexId,
});
