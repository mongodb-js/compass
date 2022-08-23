import type { SortColumn } from './indexes';

export enum ActionTypes {
  SortColumnChanged = 'indexes/sort-column/sortColumnChanged',
}

export type SortColumnChangedAction = {
  type: ActionTypes.SortColumnChanged;
  column: SortColumn;
};

type State = SortColumn;

export const INITIAL_STATE: State = 'Name and Definition';

export default function reducer(
  state = INITIAL_STATE,
  action: SortColumnChangedAction
) {
  if (action.type === ActionTypes.SortColumnChanged) {
    return action.column;
  }
  return state;
}
