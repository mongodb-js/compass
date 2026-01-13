import React, { type PropsWithChildren, useRef } from 'react';
import { createContext, useContext } from 'react';
import {
  createServiceLocator,
  registerCompassPlugin,
} from '@mongodb-js/compass-app-registry';
import {
  useDrawerActions,
  useDrawerState,
  useInitialValue,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { CollectionMetadata } from 'mongodb-collection-model';
import { CollectionSubtab, WorkspaceTab } from '@mongodb-js/workspace-info';

export const INDEXES_DRAWER_ID = 'compass-indexes-drawer';

export type IndexesDrawerPage =
  | 'indexes-list'
  | 'create-search-index'
  | 'edit-search-index';

export type IndexesDrawerContextType = {
  activeConnections: ConnectionInfo[];
  activeWorkspace: WorkspaceTab | null;
  activeCollectionMetadata: CollectionMetadata | null;
  activeCollectionSubTab: CollectionSubtab | null;
  currentPage: IndexesDrawerPage;
  indexName: string | null;
};

export const IndexesDrawerContext =
  createContext<IndexesDrawerContextType | null>(null);

export function useIndexesDrawerContext(): IndexesDrawerContextType | null {
  return useContext(IndexesDrawerContext);
}

type IndexesDrawerActionsContextType = {
  setActiveConnections?: (connections: ConnectionInfo[]) => void;
  setActiveWorkspace?: (workspace: WorkspaceTab) => void;
  setActiveCollectionMetadata?: (
    collectionMetadata: CollectionMetadata
  ) => void;
  setActiveCollectionSubTab?: (subTab: CollectionSubtab) => void;
  openIndexesListPage?: () => void;
  openCreateSearchIndexPage?: () => void;
  openEditSearchIndexPage?: (indexName: string) => void;
};

type IndexesDrawerActionsType = IndexesDrawerActionsContextType & {
  getIsIndexesDrawerEnabled: () => boolean;
};

export const IndexesDrawerActionsContext =
  createContext<IndexesDrawerActionsContextType>({
    setActiveConnections: () => {},
    setActiveWorkspace: () => {},
    setActiveCollectionMetadata: () => {},
    setActiveCollectionSubTab: () => {},
    openIndexesListPage: () => {},
    openCreateSearchIndexPage: () => {},
    openEditSearchIndexPage: () => {},
  });

export function useIndexesDrawerActions(): IndexesDrawerActionsType {
  const actions = useContext(IndexesDrawerActionsContext);
  const isSearchActivationProgramP1Enabled = usePreference(
    'enableSearchActivationProgramP1'
  );

  if (!isSearchActivationProgramP1Enabled) {
    return {
      getIsIndexesDrawerEnabled: () => false,
    };
  }

  return {
    ...actions,
    getIsIndexesDrawerEnabled: () => true,
  };
}

export const compassIndexesDrawerServiceLocator = createServiceLocator(() => {
  const actions = useIndexesDrawerActions();

  const setActiveConnectionsRef = useRef(actions.setActiveConnections);
  setActiveConnectionsRef.current = actions.setActiveConnections;

  const setActiveWorkspaceRef = useRef(actions.setActiveWorkspace);
  setActiveWorkspaceRef.current = actions.setActiveWorkspace;

  const setActiveCollectionMetadataRef = useRef(
    actions.setActiveCollectionMetadata
  );
  setActiveCollectionMetadataRef.current = actions.setActiveCollectionMetadata;

  const setActiveCollectionSubTabRef = useRef(
    actions.setActiveCollectionSubTab
  );
  setActiveCollectionSubTabRef.current = actions.setActiveCollectionSubTab;

  const openIndexesListPageRef = useRef(actions.openIndexesListPage);
  openIndexesListPageRef.current = actions.openIndexesListPage;

  const openCreateSearchIndexPageRef = useRef(
    actions.openCreateSearchIndexPage
  );
  openCreateSearchIndexPageRef.current = actions.openCreateSearchIndexPage;

  const openEditSearchIndexPageRef = useRef(actions.openEditSearchIndexPage);
  openEditSearchIndexPageRef.current = actions.openEditSearchIndexPage;

  return {
    setActiveConnections: (connections: ConnectionInfo[]) => {
      setActiveConnectionsRef.current?.(connections);
    },
    setActiveWorkspace: (workspace: WorkspaceTab) => {
      setActiveWorkspaceRef.current?.(workspace);
    },
    setActiveCollectionMetadata: (collectionMetadata: CollectionMetadata) => {
      setActiveCollectionMetadataRef.current?.(collectionMetadata);
    },
    setActiveCollectionSubTabRef: (collectionSubTab: CollectionSubtab) => {
      setActiveCollectionSubTabRef.current?.(collectionSubTab);
    },
    openIndexesListPage: () => {
      openIndexesListPageRef.current?.();
    },
    openCreateSearchIndexPage: () => {
      openCreateSearchIndexPageRef.current?.();
    },
    openEditSearchIndexPage: (indexName: string) => {
      openEditSearchIndexPageRef.current?.(indexName);
    },
  };
}, 'compassIndexesDrawerLocator');

export type CompassIndexesDrawerService = {
  setActiveConnections: (connections: ConnectionInfo[]) => void;
  setActiveWorkspace: (workspace: WorkspaceTab) => void;
  setActiveCollectionMetadata: (collectionMetadata: CollectionMetadata) => void;
  setActiveCollectionSubTab: (collectionSubTab: CollectionSubtab) => void;
  openIndexesListPage: () => void;
  openCreateSearchIndexPage: () => void;
  openEditSearchIndexPage: (indexName: string) => void;
};

export const IndexesDrawerProvider: React.FunctionComponent<
  PropsWithChildren<{
    initialState?: Partial<IndexesDrawerContextType>;
  }>
> = ({ initialState, children }) => {
  const { openDrawer } = useDrawerActions();

  const [drawerState, setDrawerState] =
    React.useState<IndexesDrawerContextType>({
      activeConnections: initialState?.activeConnections || [],
      activeWorkspace: initialState?.activeWorkspace || null,
      activeCollectionMetadata: initialState?.activeCollectionMetadata || null,
      activeCollectionSubTab: initialState?.activeCollectionSubTab || null,
      currentPage: initialState?.currentPage || 'indexes-list',
      indexName: null,
    });

  const indexesDrawerActionsContext =
    useInitialValue<IndexesDrawerActionsContextType>({
      setActiveConnections: (connections: ConnectionInfo[]) => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          activeConnections: connections,
        }));
      },
      setActiveWorkspace: (workspace: WorkspaceTab) => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          activeWorkspace: workspace,
        }));
      },
      setActiveCollectionMetadata: (collectionMetadata: CollectionMetadata) => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          activeCollectionMetadata: collectionMetadata,
        }));
      },
      setActiveCollectionSubTab: (collectionSubTab: CollectionSubtab) => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          activeCollectionSubTab: collectionSubTab,
        }));
      },
      openIndexesListPage: () => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          currentPage: 'indexes-list',
        }));
        openDrawer(INDEXES_DRAWER_ID);
      },
      openCreateSearchIndexPage: () => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          currentPage: 'create-search-index',
        }));
        openDrawer(INDEXES_DRAWER_ID);
      },
      openEditSearchIndexPage: (indexName: string) => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          currentPage: 'edit-search-index',
          indexName,
        }));
        openDrawer(INDEXES_DRAWER_ID);
      },
    });

  return (
    <IndexesDrawerContext.Provider value={drawerState}>
      <IndexesDrawerActionsContext.Provider value={indexesDrawerActionsContext}>
        {children}
      </IndexesDrawerActionsContext.Provider>
    </IndexesDrawerContext.Provider>
  );
};

export const CompassIndexesDrawerProvider = registerCompassPlugin(
  {
    name: 'CompassIndexesDrawer',
    component: ({
      initialState,
      children,
    }: PropsWithChildren<{
      initialState?: Partial<IndexesDrawerContextType>;
    }>) => {
      return (
        <IndexesDrawerProvider initialState={initialState}>
          {children}
        </IndexesDrawerProvider>
      );
    },
    activate: () => {
      return {
        store: {
          state: {},
        },
        deactivate: () => {},
      };
    },
  },
  {
    logger: createLoggerLocator('COMPASS-INDEXES-DRAWER'),
  }
);
