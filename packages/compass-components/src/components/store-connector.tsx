import React, { useEffect, useState } from 'react';
import type Reflux from 'reflux';

type StoreConnectorProps = {
  children: React.ReactElement;
  store: Reflux.Store & {
    getInitialState: () => unknown;
  };
};

/**
 * Connects our legacy reflux stores to a component's state so we can
 * use it for wrapping components and accepting a store's state as props.
 */
function StoreConnector({ children, store }: StoreConnectorProps) {
  const [storeState, setStoreState] = useState(store.state);

  useEffect(() => {
    // Subscribe to changes from the store.
    // This makes it so that the component re-renders when the store changes.
    const unsubscribe = store.listen(
      setStoreState,
      undefined /* no bound context */
    );

    return () => {
      unsubscribe();
    };
  }, [store]);

  return React.cloneElement(children, storeState);
}

export { StoreConnector };
