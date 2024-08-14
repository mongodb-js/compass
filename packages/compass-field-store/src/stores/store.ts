import { createStore } from 'redux';
import reducer, { connectionDisconnected } from '../modules';
import { FieldStoreContext } from './context';
import { type ConnectionsManager } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';

export function activatePlugin(
  _initialProps: unknown,
  { connectionsManager }: { connectionsManager: ConnectionsManager },
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(reducer);
  on(connectionsManager, 'disconnected', (connectionInfoId: string) => {
    store.dispatch(connectionDisconnected(connectionInfoId));
  });

  return { store, deactivate: cleanup, context: FieldStoreContext };
}
