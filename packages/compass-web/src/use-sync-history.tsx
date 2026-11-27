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
import { useCallback, useEffect, useRef } from 'react';
import {
  getRouteFromWorkspaceTab,
  getWorkspaceTabFromRoute,
} from './url-builder';

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

    // When navigation happens outside of the history library (for example a
    // regular `<a href="#/some/route">` link click), the new history entry
    // doesn't have an `idx` assigned by history. If any blockers are
    // registered, history v5 ignores a POP to such an entry: the url changes,
    // but `history.location` is not updated and the app never renders the new
    // route. Ideally we would only keep the blocker registered while there are
    // unsaved changes, but the "can navigate" check is pull-based and we can't
    // be notified when its result changes, so we handle these navigations here.
    //
    // This relies on history's own popstate listener running before this one:
    // history subscribes when it's created, which always happens before this
    // effect runs, so by the time we get the event, history already ignored it
    // and `history.location` still points at the previous location.
    let isReplayingPopState = false;
    const onUntrackedPopState = () => {
      if (
        isReplayingPopState ||
        typeof window.history.state?.idx === 'number'
      ) {
        return;
      }
      const prevLocation = history.location;
      const canNavigate =
        checkFnRef.current() ||
        window.confirm(
          'The content of Data Explorer has been modified. You will lose your changes if you navigate away from it.'
        );
      removeBlockerFn();
      if (canNavigate) {
        // Replay the event with our blocker removed so that history applies the
        // navigation the same way it would if nothing was blocking it. Other
        // popstate listeners will see this event twice
        isReplayingPopState = true;
        try {
          window.dispatchEvent(
            new window.PopStateEvent('popstate', {
              state: window.history.state,
            })
          );
        } finally {
          isReplayingPopState = false;
        }
        if (history.location === prevLocation) {
          // Some other blocker (for example one registered by the host app)
          // made history ignore the navigation again, the only way to render
          // the new url at this point is to load it
          window.location.reload();
          return;
        }
        if (history.location.pathname.startsWith(routePrefix)) {
          removeBlockerFn = history.block(blockerFn);
        }
      } else {
        // We can't use history.go to move back to the previous entry: the
        // untracked entry has no index, so we don't know in which direction
        // the previous one is. Instead we overwrite the untracked entry with
        // the previous location, leaving it twice in the browser history
        history.replace(prevLocation, prevLocation.state);
        removeBlockerFn = history.block(blockerFn);
      }
    };
    window.addEventListener('popstate', onUntrackedPopState);

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
      window.removeEventListener('popstate', onUntrackedPopState);
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
