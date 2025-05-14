import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { ThunkAction } from 'redux-thunk';

export function connectToConnectionAndOpenWorkspace({
  connectionId,
  namespace,
}: {
  connectionId: string;
  namespace: string;
}): ThunkAction<
  Promise<void>,
  any,
  {
    connections: ConnectionsService;
    workspaces: ReturnType<typeof workspacesServiceLocator>;
  },
  any
> {
  return async (dispatch, getState, services) => {
    try {
      const connectionInfo =
        services.connections.getConnectionById(connectionId)?.info;

      if (!connectionInfo) {
        return;
      }
      await services.connections.connect(connectionInfo);

      // ConnectionsService.connect does not throw an error if it fails to establish a connection,
      // so explicitly checking if error is in the connection item and throwing it.
      const connectionError =
        services.connections.getConnectionById(connectionId)?.error;
      if (connectionError) {
        throw connectionError;
      }
    } catch (err) {
      // services.logger.log.error(
      //   services.logger.mongoLogId(1_001_000_356),
      //   'CompassWelcome',
      //   'Failed to select connection',
      //   { err }
      // );
      console.log('aaa open workspace error:', err);

      // no-op, they'll see the toast.
      return;
    }

    services.workspaces.openCollectionWorkspace(connectionId, namespace);
  };
}
