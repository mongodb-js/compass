import { useStore } from '../stores/store-context';
import { useCallback } from 'react';
import { connectable } from '../utils/connection-supports';

export function useConnectable(): (connectionId: string) => boolean {
  const store = useStore();
  const getConnectable = useCallback(
    (connectionId: string) => {
      const conn = store.getState().connections.byId[connectionId];
      if (!conn) {
        return false;
      }

      return connectable(conn.info);
    },
    [store]
  );

  return getConnectable;
}
