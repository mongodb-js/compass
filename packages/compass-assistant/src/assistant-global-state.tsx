import type { ConnectionInfo } from '@mongodb-js/connection-info';
import React, { useEffect } from 'react';

// TODO: move workspace types to their own package and `import { WorkspaceTab, CollectionTabInfo } from '@mongodb-js/workspace-info'` instead
type WorkspaceTab = any;
type CollectionTabInfo = any;

export type GlobalState = {
  currentActiveConnections: ConnectionInfo[];
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  currentWorkspace: WorkspaceTab | null;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  currentWorkspaceCollectionInfo: CollectionTabInfo | null;
  currentQuery: object | null;
  currentAggregation: object | null;
};

const INITIAL_STATE: GlobalState = {
  currentActiveConnections: [],
  currentWorkspace: null,
  currentWorkspaceCollectionInfo: null,
  currentQuery: null,
  currentAggregation: null,
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
      return {
        ...prevState,
        [stateKey]: newState,
      };
    });
  }, [newState, setState, stateKey]);
}

export function useAssistantGlobalState() {
  return React.useContext(AssistantGlobalStateContext);
}
