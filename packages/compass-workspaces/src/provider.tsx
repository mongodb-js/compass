import { useCallback, useMemo } from 'react';
import { useSelector, useStore } from './stores/context';
import type { OpenWorkspaceOptions, TabOptions } from './stores/workspaces';
import {
  getActiveTab,
  openWorkspace as openWorkspaceAction,
} from './stores/workspaces';

export function useActiveWorkspace() {
  return useSelector((state) => getActiveTab(state));
}

export function useOpenWorkspace() {
  const store = useStore();
  const openWorkspace = useCallback(
    (...args: Parameters<typeof openWorkspaceAction>) => {
      store.dispatch(openWorkspaceAction(...args));
    },
    [store]
  );
  const openMyQueriesWorkspace = useCallback(
    (tabOptions?: TabOptions) => {
      openWorkspace({ type: 'My Queries' }, tabOptions);
    },
    [openWorkspace]
  );
  const openDatabasesWorkspace = useCallback(
    (tabOptions?: TabOptions) => {
      openWorkspace({ type: 'Databases' }, tabOptions);
    },
    [openWorkspace]
  );
  const openPerformanceWorkspace = useCallback(
    (tabOptions?: TabOptions) => {
      openWorkspace({ type: 'Performance' }, tabOptions);
    },
    [openWorkspace]
  );
  const openCollectionsWorkspace = useCallback(
    (namespace: string, tabOptions?: TabOptions) => {
      openWorkspace({ type: 'Collections', namespace }, tabOptions);
    },
    [openWorkspace]
  );
  const openCollectionWorkspace = useCallback(
    (
      namespace: string,
      collectionOptions?: Omit<
        Extract<OpenWorkspaceOptions, { type: 'Collection' }>,
        'type' | 'namespace'
      > | null,
      tabOptions?: TabOptions
    ) => {
      openWorkspace(
        { type: 'Collection', namespace, ...collectionOptions },
        tabOptions
      );
    },
    [openWorkspace]
  );
  const methods = useMemo(() => {
    return {
      openMyQueriesWorkspace,
      openDatabasesWorkspace,
      openPerformanceWorkspace,
      openCollectionsWorkspace,
      openCollectionWorkspace,
    };
  }, [
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
    openPerformanceWorkspace,
  ]);
  return methods;
}

/**
 * Not to be used in React runtime, defined as hook and re-exported with the
 * correct name only so that we don't need to disable eslint rules-of-hooks in
 * this file
 *
 * @internal
 */
function useWorkspacesService() {
  const store = useStore();
  const openWorkspaceFns = useOpenWorkspace();
  const _getActiveWorkspace = useCallback(() => {
    return getActiveTab(store.getState());
  }, [store]);
  const service = useMemo(() => {
    return { getActiveWorkspace: _getActiveWorkspace, ...openWorkspaceFns };
  }, [openWorkspaceFns, _getActiveWorkspace]);
  return service;
}

export const workspacesServiceLocator = useWorkspacesService;
