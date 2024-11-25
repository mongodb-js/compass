import { applyMiddleware, createStore } from 'redux';
import reducer, { connectionDisconnected } from '../modules';
import { FieldStoreContext } from './context';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import thunk from 'redux-thunk';
import type { Logger } from '@mongodb-js/compass-logging/provider';

export function activatePlugin(
  _initialProps: unknown,
  { connections, logger }: { connections: ConnectionsService; logger: Logger },
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ logger }))
  );
  on(connections, 'disconnected', (connectionInfoId: string) => {
    store.dispatch(connectionDisconnected(connectionInfoId));
  });

  return { store, deactivate: cleanup, context: FieldStoreContext };
}
