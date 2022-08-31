import { ActionTypes as IndexesActionTypes } from './indexes';
import type { SortDirection, SortIndexesAction } from './indexes';

type State = SortDirection;

export const INITIAL_STATE: State = 'asc';

export default function reducer(
  state = INITIAL_STATE,
  action: Pick<SortIndexesAction, 'type' | 'order'>
) {
  if (action.type === IndexesActionTypes.SortIndexes) {
    return action.order;
  }
  return state;
}
