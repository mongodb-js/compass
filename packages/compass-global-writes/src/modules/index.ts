import { combineReducers } from 'redux';
import type { Action, AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

import namespace from './namespace';

const reducer = combineReducers({
  namespace,
});

export type RootState = ReturnType<typeof reducer>;

export type GlobalWritesExtraArgs = {
  logger: Logger;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
};

export type GlobalWritesThunkDispatch<A extends Action = AnyAction> =
  ThunkDispatch<RootState, GlobalWritesExtraArgs, A>;

export type GlobalWritesThunkAction<R, A extends Action> = ThunkAction<
  R,
  RootState,
  GlobalWritesExtraArgs,
  A
>;

export default reducer;
