import type { Action, Reducer } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

import type { AtlasGlobalWritesService } from '../services/atlas-global-writes-service';

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


const reducer: Reducer<RootState, Action> = (
  state = initialState,
) => {
  return state;
}

export type GlobalWritesExtraArgs = {
  logger: Logger;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
  atlasGlobalWritesService: AtlasGlobalWritesService;
};

export type GlobalWritesThunkDispatch<A extends Action = Action> =
  ThunkDispatch<RootState, GlobalWritesExtraArgs, A>;

export type GlobalWritesThunkAction<R, A extends Action> = ThunkAction<
  R,
  RootState,
  GlobalWritesExtraArgs,
  A
>;

export default reducer;