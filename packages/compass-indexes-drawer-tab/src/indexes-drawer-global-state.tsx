import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type {
  WorkspaceTab,
  CollectionSubtab,
} from '@mongodb-js/workspace-info';
import type { CollectionMetadata } from 'mongodb-collection-model';
import React, { useEffect } from 'react';

export type GlobalState = {
  activeConnections: ConnectionInfo[];
  activeWorkspace: WorkspaceTab | null;
  activeCollectionMetadata: CollectionMetadata | null;
  activeCollectionSubTab: CollectionSubtab | null;
};

const INITIAL_STATE: GlobalState = {
  activeConnections: [],
  activeWorkspace: null,
  activeCollectionMetadata: null,
  activeCollectionSubTab: null,
};

const IndexesDrawerGlobalStateContext = React.createContext<GlobalState>({
  ...INITIAL_STATE,
});

const IndexesDrawerGlobalSetStateContext = React.createContext<
  React.Dispatch<React.SetStateAction<GlobalState>>
>(() => undefined);

export const IndexesDrawerGlobalStateProvider: React.FunctionComponent = ({
  children,
}) => {
  const [globalState, setGlobalState] = React.useState({ ...INITIAL_STATE });
  return (
    <IndexesDrawerGlobalStateContext.Provider value={globalState}>
      <IndexesDrawerGlobalSetStateContext.Provider value={setGlobalState}>
        {children}
      </IndexesDrawerGlobalSetStateContext.Provider>
    </IndexesDrawerGlobalStateContext.Provider>
  );
};

export function useSyncIndexesDrawerGlobalState<T extends keyof GlobalState>(
  stateKey: T,
  newState: GlobalState[T]
) {
  const setState = React.useContext(IndexesDrawerGlobalSetStateContext);
  useEffect(() => {
    setState((prevState) => {
      const state = {
        ...prevState,
        [stateKey]: newState,
      };

      // Get rid of some non-sensical states incase the user switches away from
      // a collection tab to something that is not a collection tab.
      // activeConnections and activeWorkspace will get updated no matter
      // how/where the user navigates because those concepts are always
      // "present" in a way that an active collection is not.
      if (state.activeWorkspace?.type !== 'Collection') {
        state.activeCollectionMetadata = null;
        state.activeCollectionSubTab = null;
      }

      return state;
    });
  }, [newState, setState, stateKey]);
}

export function useIndexesDrawerGlobalState() {
  return React.useContext(IndexesDrawerGlobalStateContext);
}
