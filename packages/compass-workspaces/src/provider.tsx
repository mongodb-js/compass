import React, { useContext, useRef } from 'react';
import { useSelector, useStore } from './stores/context';
import type {
  OpenWorkspaceOptions,
  TabOptions,
  WorkspaceTab,
} from './stores/workspaces';
import {
  collectionSubtabSelected,
  getActiveTab,
  openWorkspace as openWorkspaceAction,
} from './stores/workspaces';
import { createServiceLocator } from 'hadron-app-registry';
import type { CollectionSubtab } from './types';
import type { WorkspaceCloseHandler } from './components/workspace-tab-state-provider';
import { useRegisterTabCloseHandler } from './components/workspace-tab-state-provider';

function useWorkspacesStore() {
  try {
    return useStore();
  } catch {
    throw new Error(
      "Can't find Workspaces store in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
}

function useActiveWorkspaceSelector() {
  return useSelector(getActiveTab);
}

const kSelector = Symbol('useActiveWorkspaceSelector');

export type WorkspacesService = {
  /**
   * Get current active workspace tab
   */
  getActiveWorkspace(this: void): WorkspaceTab | null;
  /**
   * Open "My Queries" workspace showing a list of aggregations and queries
   * saved by the user
   */
  openMyQueriesWorkspace(this: void, tabOptions?: TabOptions): void;

  /**
   * Open "Shell" workspace
   */
  openShellWorkspace(
    this: void,
    connectionId: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Databases" workspace showing list of all databases in the cluster
   */
  openDatabasesWorkspace(
    this: void,
    connectionId: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Performance" workspace showing charts of various cluster performance
   * metrics
   */
  openPerformanceWorkspace(
    this: void,
    connectionId: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Collections" workspace showing list of collections for a certain
   * database namespace
   */
  openCollectionsWorkspace(
    this: void,
    connectionId: string,
    namespace: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Collection" workspace showing various features to interact with a
   * collection for a certain namespace
   */
  openCollectionWorkspace(
    this: void,
    connectionId: string,
    namespace: string,
    options?: TabOptions &
      Omit<
        Extract<OpenWorkspaceOptions, { type: 'Collection' }>,
        'type' | 'namespace' | 'editViewName' | 'initialSubtab' | 'connectionId'
      >
  ): void;
  /**
   * Open subTab in "Collection" workspace
   */
  openCollectionWorkspaceSubtab(
    this: void,
    tabId: string,
    subtab: CollectionSubtab
  ): void;
  /**
   * Open "Collection" workspace for a view namespace in a specially handled
   * "Editing view" state
   */
  openEditViewWorkspace(
    this: void,
    connectionId: string,
    viewNamespace: string,
    options: { sourceName: string; sourcePipeline: unknown[] } & TabOptions
  ): void;
  /**
   * Tab workspaces can register a callback that will be called before tab will
   * be closed (either by user clicking close button, or due to other tab
   * replacing the content). The callback can change the closing behavior by
   * returning the following responses:
   *
   * - "allow"            allows the tab to be closed, if more than one handler
   *                      is registered and this state is returned, will call
   *                      the next handler
   * - "user-allow"       allows the tab to be closed
   * - "deny"             prevent the tab from being closed
   * - "open-in-new-tab"  in case that tab is getting replaced, open new
   *                      workspace in new tab instead
   *
   * Method might be `undefined` if workspace service is injected outside of the
   * workspace scope
   *
   * @example
   * workspaceService.registerTabCloseHandler?.(async function () {
   *   const confirmed = await showConfirmation({
   *     description: 'Are you sure you want to close this tab?
   *   });
   *   return confirmed ? 'user-allow' : 'deny';
   * })
   */
  registerTabCloseHandler?: (handler: WorkspaceCloseHandler) => () => void;
  /**
   * useActiveWorkspace hook, exposed through the service interface so that it
   * can be mocked in the test environment
   * @internal
   */
  [kSelector]?: typeof useActiveWorkspaceSelector | undefined;
};

const throwIfNotTestEnv = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      "Can't find Workspaces service in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
};

const noopWorkspacesService = {
  getActiveWorkspace() {
    throwIfNotTestEnv();
    return null;
  },
  openMyQueriesWorkspace: throwIfNotTestEnv,
  openShellWorkspace: throwIfNotTestEnv,
  openDatabasesWorkspace: throwIfNotTestEnv,
  openPerformanceWorkspace: throwIfNotTestEnv,
  openCollectionsWorkspace: throwIfNotTestEnv,
  openCollectionWorkspaceSubtab: throwIfNotTestEnv,
  openCollectionWorkspace: throwIfNotTestEnv,
  openEditViewWorkspace: throwIfNotTestEnv,
  [kSelector]() {
    throwIfNotTestEnv();
    return null;
  },
};

const WorkspacesServiceContext = React.createContext<WorkspacesService>(
  noopWorkspacesService
);

export const WorkspacesServiceProvider: React.FunctionComponent<{
  value?: WorkspacesService;
}> = ({ value, children }) => {
  // We're breaking React rules of hooks here, but this is unavoidable to allow
  // for testing components using this service. In reality this will never be a
  // conditional call to hooks: either the tests will be providing a mock
  // service for all renders, or not and we will call hooks that are setting up
  // the service from actual store
  /* eslint-disable react-hooks/rules-of-hooks */
  value ??= (() => {
    const store = useWorkspacesStore();
    const service = useRef<WorkspacesService>({
      getActiveWorkspace: () => {
        return getActiveTab(store.getState());
      },
      openMyQueriesWorkspace: (tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction({ type: 'My Queries' }, tabOptions)
        );
      },
      openShellWorkspace(connectionId, tabOptions) {
        return void store.dispatch(
          openWorkspaceAction({ type: 'Shell', connectionId }, tabOptions)
        );
      },
      openDatabasesWorkspace: (connectionId, tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction({ type: 'Databases', connectionId }, tabOptions)
        );
      },
      openPerformanceWorkspace: (connectionId, tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction({ type: 'Performance', connectionId }, tabOptions)
        );
      },
      openCollectionsWorkspace: (connectionId, namespace, tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction(
            { type: 'Collections', connectionId, namespace },
            tabOptions
          )
        );
      },
      openCollectionWorkspace: (connectionId, namespace, options) => {
        const { newTab, ...collectionOptions } = options ?? {};
        return void store.dispatch(
          openWorkspaceAction(
            {
              type: 'Collection',
              connectionId,
              namespace,
              ...collectionOptions,
            },
            { newTab }
          )
        );
      },
      openCollectionWorkspaceSubtab(tabId, subtab) {
        store.dispatch(collectionSubtabSelected(tabId, subtab));
      },
      openEditViewWorkspace: (connectionId, viewNamespace, options) => {
        const { newTab, sourceName, sourcePipeline } = options ?? {};
        return void store.dispatch(
          openWorkspaceAction(
            {
              type: 'Collection',
              connectionId,
              namespace: sourceName,
              initialPipeline: sourcePipeline,
              editViewName: viewNamespace,
            },
            { newTab }
          )
        );
      },
      [kSelector]: useActiveWorkspaceSelector,
    });
    return service.current;
  })();
  /* eslint-enable react-hooks/rules-of-hooks */

  return (
    <WorkspacesServiceContext.Provider value={value}>
      {children}
    </WorkspacesServiceContext.Provider>
  );
};

function useWorkspacesService() {
  const service = useContext(WorkspacesServiceContext);
  if (!service) {
    throw new Error(
      "Can't find Workspaces service in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
  const registerTabCloseHandler = useRegisterTabCloseHandler();
  return { ...service, registerTabCloseHandler };
}

export function useOpenWorkspace() {
  const {
    openShellWorkspace,
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
    openPerformanceWorkspace,
    openEditViewWorkspace,
  } = useWorkspacesService();

  const openFns = useRef({
    openShellWorkspace,
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
    openPerformanceWorkspace,
    openEditViewWorkspace,
  });

  return openFns.current;
}

export function useActiveWorkspace() {
  const service = useWorkspacesService();
  // We call useSelector to create a subscription to the state update ...
  service[kSelector]?.();
  // ... but return the value from the service so that it can be mocked in tests
  // if needed
  return service.getActiveWorkspace();
}

export const workspacesServiceLocator = createServiceLocator(
  useWorkspacesService,
  'workspacesServiceLocator'
);

export { useWorkspacePlugins } from './components/workspaces-provider';
export {
  useTabState,
  useOnTabCloseHandler,
} from './components/workspace-tab-state-provider';
