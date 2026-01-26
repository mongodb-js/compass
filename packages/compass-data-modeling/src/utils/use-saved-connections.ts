import { useConnectionsList } from '@mongodb-js/compass-connections/provider';
import { useMemo } from 'react';

type SavedConnection = {
  id: string;
  name: string;
  description?: string;
};

/**
 * Hook to get the list of saved connections, with active connections first.
 */
export function useSavedConnections(): SavedConnection[] {
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
