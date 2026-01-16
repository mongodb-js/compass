import React, { type PropsWithChildren, useRef } from 'react';
import { createContext, useContext } from 'react';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  useDrawerActions,
  useInitialValue,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';

export const INDEXES_DRAWER_ID = 'compass-indexes-drawer';

export type IndexesDrawerPage =
  | 'indexes-list'
  | 'create-search-index'
  | 'edit-search-index';

export type IndexesDrawerContextType = {
  currentPage: IndexesDrawerPage;
  currentIndexName: string | null;
};

export const IndexesDrawerContext =
  createContext<IndexesDrawerContextType | null>(null);

export function useIndexesDrawerContext(): IndexesDrawerContextType | null {
  return useContext(IndexesDrawerContext);
}

type IndexesDrawerActionsContextType = {
  openIndexesListPage?: () => void;
  openCreateSearchIndexPage?: () => void;
  openEditSearchIndexPage?: (currentIndexName: string) => void;
};

type IndexesDrawerActionsType = IndexesDrawerActionsContextType & {
  getIsIndexesDrawerEnabled: () => boolean;
};

export const IndexesDrawerActionsContext =
  createContext<IndexesDrawerActionsContextType>({
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

  const openIndexesListPageRef = useRef(actions.openIndexesListPage);
  openIndexesListPageRef.current = actions.openIndexesListPage;

  const openCreateSearchIndexPageRef = useRef(
    actions.openCreateSearchIndexPage
  );
  openCreateSearchIndexPageRef.current = actions.openCreateSearchIndexPage;

  const openEditSearchIndexPageRef = useRef(actions.openEditSearchIndexPage);
  openEditSearchIndexPageRef.current = actions.openEditSearchIndexPage;

  return {
    openIndexesListPage: () => {
      openIndexesListPageRef.current?.();
    },
    openCreateSearchIndexPage: () => {
      openCreateSearchIndexPageRef.current?.();
    },
    openEditSearchIndexPage: (currentIndexName: string) => {
      openEditSearchIndexPageRef.current?.(currentIndexName);
    },
  };
}, 'compassIndexesDrawerLocator');

export type CompassIndexesDrawerService = {
  openIndexesListPage: () => void;
  openCreateSearchIndexPage: () => void;
  openEditSearchIndexPage: (currentIndexName: string) => void;
};

export const IndexesDrawerProvider: React.FunctionComponent<
  PropsWithChildren<{
    initialState?: Partial<IndexesDrawerContextType>;
  }>
> = ({ initialState, children }) => {
  const { openDrawer } = useDrawerActions();

  const [drawerState, setDrawerState] =
    React.useState<IndexesDrawerContextType>({
      currentPage: initialState?.currentPage ?? 'indexes-list',
      currentIndexName: initialState?.currentIndexName ?? null,
    });

  const indexesDrawerActionsContext =
    useInitialValue<IndexesDrawerActionsContextType>({
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
      openEditSearchIndexPage: (currentIndexName: string) => {
        setDrawerState((drawerState: IndexesDrawerContextType) => ({
          ...drawerState,
          currentPage: 'edit-search-index',
          currentIndexName,
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
