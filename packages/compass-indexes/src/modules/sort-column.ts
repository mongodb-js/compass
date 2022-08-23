import { ActionTypes as IndexesActionTypes } from './indexes';
import type { SortColumn, SortIndexesAction } from './indexes';

type State = SortColumn;

export const INITIAL_STATE: State = 'Name and Definition';

export default function reducer(
  state = INITIAL_STATE,
  action: SortIndexesAction
) {
  if (action.type === IndexesActionTypes.SortIndexes) {
    return action.column;
  }
  return state;
}
