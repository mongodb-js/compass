import { useConnectionsList } from '@mongodb-js/compass-connections/provider';
import { useMemo } from 'react';

export function useSavedConnections() {
  const connections = useConnectionsList();
  return useMemo(() => {
    const active = [];
    const other = [];
    for (const connection of connections) {
      if (connection.status === 'connected') {
        active.push({
          id: connection.info.id,
          name: connection.title,
          description: 'Active',
        });
      } else {
        other.push({
          id: connection.info.id,
          name: connection.title,
        });
      }
    }
    return [...active, ...other];
  }, [connections]);
}
