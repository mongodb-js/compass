import { createStore } from 'redux';
import reducer, { removeConnectionNamespaces } from '../modules';
import { FieldStoreContext } from './context';
import {
  ConnectionsManagerEvents,
  type ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';

export function activatePlugin(
  _initialProps: unknown,
  { connectionsManager }: { connectionsManager: ConnectionsManager },
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(reducer);
  on(
    connectionsManager,
    ConnectionsManagerEvents.ConnectionDisconnected,
    (connectionInfoId: string) => {
      store.dispatch(removeConnectionNamespaces(connectionInfoId));
    }
  );

  return { store, deactivate: cleanup, context: FieldStoreContext };
}
