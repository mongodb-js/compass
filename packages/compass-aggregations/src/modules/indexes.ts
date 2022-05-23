import type { Reducer } from 'redux';
import type { IndexDirection } from 'mongodb';

export enum ActionTypes {
  IndexesFetched = 'compass-aggregations/indexesFetched',
}

type IndexInfo = {
  ns: string;
  name: string;
  key: Record<string, IndexDirection>;
  extra: Record<string, any>;
};

type IndexesFetchedAction = {
  type: ActionTypes.IndexesFetched;
  indexes: IndexInfo[];
};

export type Actions = IndexesFetchedAction;

export type State = IndexInfo[];

export const INITIAL_STATE: State = [];

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.IndexesFetched:
      return action.indexes;
    default:
      return state;
  }
};

export const indexesFetched = (indexes: IndexInfo[]): IndexesFetchedAction => ({
  type: ActionTypes.IndexesFetched,
  indexes,
});

export default reducer;