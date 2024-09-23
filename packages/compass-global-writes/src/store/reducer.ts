import type { Action, Reducer } from 'redux';

export enum ShardingStatuses {
  /**
   * No information yet.
   */
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export type RootState = {
  namespace: string;
  isNamespaceSharded: boolean;
  status: keyof typeof ShardingStatuses;
};

const initialState: RootState = {
  namespace: '',
  isNamespaceSharded: false,
  status: ShardingStatuses.NOT_AVAILABLE,
};

const reducer: Reducer<RootState, Action> = (state = initialState) => {
  return state;
};

export default reducer;
