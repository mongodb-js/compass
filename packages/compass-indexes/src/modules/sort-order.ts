import type { SortDirection } from './indexes';

export enum ActionTypes {
  SortOrderChanged = 'indexes/sort-order/sortOrderChanged',
}

export type SortOrderChangedAction = {
  type: ActionTypes.SortOrderChanged;
  order: SortDirection;
};

type State = SortDirection;

export const INITIAL_STATE: State = 'asc';

export default function reducer(
  state = INITIAL_STATE,
  action: SortOrderChangedAction
) {
  if (action.type === ActionTypes.SortOrderChanged) {
    return action.order;
  }
  return state;
}
