import type { Action, Reducer } from 'redux';

export enum ShardingStatuses {
  /**
   * Initial status, no information available yet.
   */
  NOT_READY = 'NOT_READY',
}

export type RootState = {
  namespace: string;
  isNamespaceSharded: boolean;
  status: keyof typeof ShardingStatuses;
};

const initialState: RootState = {
  namespace: '',
  isNamespaceSharded: false,
  status: ShardingStatuses.NOT_READY,
};

const reducer: Reducer<RootState, Action> = (state = initialState) => {
  return state;
};

export default reducer;
