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
  currentQuery: string | null;
  currentAggregation: string | null;
  activeCollectionSubTab: CollectionSubtab | null;
};

const INITIAL_STATE: GlobalState = {
  activeConnections: [],
  activeWorkspace: null,
  activeCollectionMetadata: null,
  currentQuery: null,
  currentAggregation: null,
  activeCollectionSubTab: null,
};

const AssistantGlobalStateContext = React.createContext<GlobalState>({
  ...INITIAL_STATE,
});

const AssistantGlobalSetStateContext = React.createContext<
  React.Dispatch<React.SetStateAction<GlobalState>>
>(() => undefined);

export const AssistantGlobalStateProvider: React.FunctionComponent = ({
  children,
}) => {
  const [globalState, setGlobalState] = React.useState({ ...INITIAL_STATE });
  return (
    <AssistantGlobalStateContext.Provider value={globalState}>
      <AssistantGlobalSetStateContext.Provider value={setGlobalState}>
        {children}
      </AssistantGlobalSetStateContext.Provider>
    </AssistantGlobalStateContext.Provider>
  );
};

export function useSyncAssistantGlobalState<T extends keyof GlobalState>(
  stateKey: T,
  newState: GlobalState[T]
) {
  const setState = React.useContext(AssistantGlobalSetStateContext);
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

export function useAssistantGlobalState() {
  return React.useContext(AssistantGlobalStateContext);
}
