import {
  useCurrentValueRef,
  useInitialValue,
} from '@mongodb-js/compass-components';
import type { OpenWorkspaceOptions } from '@mongodb-js/compass-workspaces';
import type {
  CollectionTabInfo,
  WorkspaceTab,
} from '@mongodb-js/workspace-info';
import type { History, Blocker } from 'history';
import {
  getRouteFromWorkspaceTab,
  getWorkspaceTabFromRoute,
} from './url-builder';
import { useCallback, useEffect, useRef } from 'react';

export type { History };

type OnActiveWorkspaceTabChangeFn = <Workspace extends WorkspaceTab>(
  workspace: Workspace | null,
  collectionInfo: Workspace extends { type: 'Collection' }
    ? CollectionTabInfo | null
    : never
) => void;

function useBeforeUnloadConfirm(
  historyRef: { current: History | undefined },
  checkFnRef: { current: () => boolean },
  routePrefix: string
) {
  useEffect(() => {
    if (!historyRef.current) {
      return;
    }

    const history = historyRef.current;

    const blockerFn: Blocker = ({ location: newLocation, retry, action }) => {
      function maybeUnblockNavigation() {
        const isNavigatingInsideDataExplorer =
          newLocation.pathname.startsWith(routePrefix);
        const canNavigate =
          // All navigation inside DE is allowed
          isNavigatingInsideDataExplorer ||
          // Checks in compass-web allowed navigation
          checkFnRef.current() ||
          // User confirmed that navigating away is okay
          window.confirm(
            'The content of Data Explorer has been modified. You will lose your changes if you navigate away from it.'
          );

        // The way history.block works is that instead of returning some sort of
        // condition that would allow the navigation to go through, you block
        // all navigation when .block() is called and then can conditionally
        // unblock and re-run the navigation transition by calling retry.
        // Because some navigation happens inside data explorer and some of it
        // happens outside of compass-web route, we block everything
        // unconditionally, unblock and retry if navigation should be allowed,
        // and then block it again so that the next navigation can be checked
        // again
        if (canNavigate) {
          // Unblock and apply new navigation
          removeBlockerFn();
          retry();

          // Restore the block if we navigated inside data explorer so that we
          // can catch the next navigation attempt
          if (isNavigatingInsideDataExplorer) {
            removeBlockerFn = history.block(blockerFn);
          }
        }
      }

      // POP is a special case: when it happens, history package first
      // force-restores previous navigation state. We have to wait for this to
      // fully finish, otherwise our retry will no apply correctly
      if (action === 'POP') {
        window.addEventListener('popstate', maybeUnblockNavigation, {
          once: true,
        });
      } else {
        maybeUnblockNavigation();
      }
    };

    let removeBlockerFn: () => void = historyRef.current.block(blockerFn);

    // react-router history unconditionally blocks navigation on unload by
    // default when history.block is used, we add our own listener to be able to
    // unblock it before event handler in history has a chance to kick in and
    // unconditionally block the navigation
    const onBeforeUnload = () => {
      if (checkFnRef.current()) {
        removeBlockerFn();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload, true);
      removeBlockerFn();
    };
  }, [checkFnRef, historyRef, routePrefix]);
}

export function useSyncHistory(
  history?: History,
  routePrefix = 'explorer'
): {
  initialWorkspaceTabs: OpenWorkspaceOptions[];
  autoconnectId: string | undefined;
  onActiveWorkspaceTabChange: OnActiveWorkspaceTabChangeFn;
  onBeforeUnloadCallbackRequest: (cb: () => boolean) => void;
} {
  const normalizedRoutePrefix = useInitialValue(() => {
    return `/${routePrefix.replace(/^\//, '')}`;
  });
  const historyRef = useCurrentValueRef(history);
  const beforeUnloadCallbackRef = useRef<() => boolean>(() => true);

  const initialWorkspaceTabs = useInitialValue(() => {
    if (!historyRef.current) {
      return [];
    }
    const workspace = getWorkspaceTabFromRoute(
      historyRef.current.location.pathname.replace(normalizedRoutePrefix, '')
    );
    return workspace ? [workspace] : [];
  });

  const autoconnectId = useInitialValue(() => {
    return initialWorkspaceTabs[0] && 'connectionId' in initialWorkspaceTabs[0]
      ? initialWorkspaceTabs[0].connectionId
      : undefined;
  });

  const onActiveWorkspaceTabChange: OnActiveWorkspaceTabChangeFn = useCallback(
    (workspace) => {
      const route = normalizedRoutePrefix + getRouteFromWorkspaceTab(workspace);
      historyRef.current?.replace(route);
    },
    [historyRef, normalizedRoutePrefix]
  );

  const onBeforeUnloadCallbackRequest = useCallback((cb: () => boolean) => {
    beforeUnloadCallbackRef.current = cb;
  }, []);

  useBeforeUnloadConfirm(
    historyRef,
    beforeUnloadCallbackRef,
    normalizedRoutePrefix
  );

  return {
    initialWorkspaceTabs,
    autoconnectId,
    onActiveWorkspaceTabChange,
    onBeforeUnloadCallbackRequest,
  };
}
