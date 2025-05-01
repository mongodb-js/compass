import { useSelector, useStore } from '../stores/store-context';
import { useRef, useState } from 'react';
import { connectable } from '../utils/connection-supports';

export function useConnectable(connectionId: string): boolean {
  return useSelector((state) => {
    const connection = state.connections.byId[connectionId];

    if (!connection) {
      return false;
    }

    return connectable(connection.info);
  });
}

export function useConnectableRef(): {
  getConnectable(this: void, connectionId: string): boolean;
} {
  const storeRef = useRef(useStore());
  const [ref] = useState(() => {
    return {
      getConnectable(connectionId: string) {
        const conn = storeRef.current.getState().connections.byId[connectionId];
        if (!conn) {
          return false;
        }

        return connectable(conn.info);
      },
    };
  });
  return ref;
}
