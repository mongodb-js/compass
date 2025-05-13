import type { Reducer } from 'redux';

type SessionState = {
  selectedConnectionId: string | null;
};

const INITIAL_STATE: SessionState = {
  selectedConnectionId: null,
};

export enum SessionStateActions {
  ConnectionSelected = 'compass-mcp/sessions/ConnectionSelected',
}

export const sessionsReducer: Reducer<SessionState> = (
  state = INITIAL_STATE
) => {
  return state;
};

export default sessionsReducer;
