import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { combineReducers } from 'redux';
import connections from './connections';
import sessions from './sessions';
import type { MCPStoreServices } from '.';
import type { MCPService } from '../mcp-service';

const reducer = combineReducers({
  connections,
  sessions,
});

export type MCPStoreRootState = ReturnType<typeof reducer>;
export type MCPStoreExtraArgs = MCPStoreServices & {
  mcpService: MCPService;
};
export type MCPStoreThunkAction<R, A extends AnyAction> = ThunkAction<
  R,
  MCPStoreRootState,
  MCPStoreExtraArgs,
  A
>;

export default reducer;
