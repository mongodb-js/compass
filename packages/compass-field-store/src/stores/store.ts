import { applyMiddleware, createStore } from 'redux';
import reducer, { connectionDisconnected } from '../modules';
import { FieldStoreContext } from './context';
import { type ConnectionsManager } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import thunk from 'redux-thunk';
import type { Logger } from '@mongodb-js/compass-logging/provider';

export function activatePlugin(
  _initialProps: unknown,
  {
    connectionsManager,
    logger,
  }: { connectionsManager: ConnectionsManager; logger: Logger },
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ logger }))
  );
  on(connectionsManager, 'disconnected', (connectionInfoId: string) => {
    store.dispatch(connectionDisconnected(connectionInfoId));
  });

  return { store, deactivate: cleanup, context: FieldStoreContext };
}
