import { type DevtoolsConnectOptions } from '@mongosh/service-provider-node-driver';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type {
  WorkspaceTab,
  CollectionSubtab,
} from '@mongodb-js/workspace-info';
import type { CollectionMetadata } from 'mongodb-collection-model';
import React, { useEffect } from 'react';

export type ActiveConnectionInfo = ConnectionInfo & {
  connectOptions: DevtoolsConnectOptions | null;
};

export type GlobalState = {
  activeConnections: ActiveConnectionInfo[];
  activeWorkspace: WorkspaceTab | null;
  activeCollectionMetadata: CollectionMetadata | null;
  currentQuery: string | null;
  currentPipeline: string | null;
  activeCollectionSubTab: CollectionSubtab | null;
  /**
   * The connection the user picked from the connection selector inside the
   * Assistant workspace tab. Only consulted when the active workspace is the
   * Assistant tab — otherwise the connection comes from the workspace itself.
   */
  assistantTabConnectionId: string | null;
};

const INITIAL_STATE: GlobalState = {
  activeConnections: [],
  activeWorkspace: null,
  activeCollectionMetadata: null,
  currentQuery: null,
  currentPipeline: null,
  activeCollectionSubTab: null,
  assistantTabConnectionId: null,
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

/**
 * Resolve the connection the assistant should treat as "active" for the
 * current workspace. When viewing the Assistant tab, this is the connection
 * the user picked from the in-tab selector; for connection-scoped workspaces
 * it's `activeWorkspace.connectionId`; otherwise null.
 */
export function getActiveAssistantConnection(
  globalState: Pick<
    GlobalState,
    'activeConnections' | 'activeWorkspace' | 'assistantTabConnectionId'
  >
): ActiveConnectionInfo | null {
  const { activeConnections, activeWorkspace, assistantTabConnectionId } =
    globalState;
  let connectionId: string | null = null;
  if (activeWorkspace?.type === 'Assistant') {
    connectionId = assistantTabConnectionId;
  } else if (
    activeWorkspace &&
    'connectionId' in activeWorkspace &&
    typeof activeWorkspace.connectionId === 'string'
  ) {
    connectionId = activeWorkspace.connectionId;
  }
  if (!connectionId) {
    return null;
  }
  return (
    activeConnections.find((connInfo) => connInfo.id === connectionId) ?? null
  );
}
