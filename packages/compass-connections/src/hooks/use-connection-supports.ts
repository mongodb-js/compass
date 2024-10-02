import { useSelector } from '../stores/store-context';
import type { ConnectionFeature } from '../utils/connection-supports';
import { connectionSupports } from '../utils/connection-supports';

export function useConnectionSupports(
  connectionId: string,
  connectionFeature: ConnectionFeature
): boolean {
  return useSelector((state) => {
    const connection = state.connections.byId[connectionId];

    if (!connection) {
      return false;
    }

    return connectionSupports(connection.info, connectionFeature);
  });
}
