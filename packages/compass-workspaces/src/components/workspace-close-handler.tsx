import { useEffect, useRef } from 'react';
import type { WorkspaceTab } from '../stores/workspaces';
import { useWorkspaceTabId } from './workspace-tab-state-provider';

export type WorkspaceDestroyHandler = () => boolean;

const HANDLERS = {
  close: new Map<string, WorkspaceDestroyHandler[]>(),
  replace: new Map<string, WorkspaceDestroyHandler[]>(),
} as const;

const resolveTabDestroyState = (
  type: 'close' | 'replace',
  tab: WorkspaceTab
): boolean => {
  const handlers = HANDLERS[type].get(tab.id) ?? [];

  for (const handler of handlers) {
    if (handler() === false) {
      return false;
    }
  }

  return true;
};

export const canCloseTab = (tab: WorkspaceTab) => {
  return resolveTabDestroyState('close', tab);
};

export const canReplaceTab = (tab: WorkspaceTab) => {
  return resolveTabDestroyState('replace', tab);
};

/**
 * Exported only for testing purposes
 * @internal
 */
export const setTabDestroyHandler = (
  type: 'close' | 'replace',
  tabId: string,
  handler: WorkspaceDestroyHandler
) => {
  const handlerMap = HANDLERS[type];
  const handlers = handlerMap.get(tabId) ?? [];
  handlerMap.set(tabId, handlers.concat(handler));
  return () => {
    cleanupTabDestroyHandler(type, tabId, handler);
  };
};

export const cleanupTabDestroyHandler = (
  type?: 'close' | 'replace',
  tabId?: string,
  handler?: WorkspaceDestroyHandler
) => {
  if (handler && tabId && type) {
    HANDLERS[type].set(
      tabId,
      (HANDLERS[type].get(tabId) ?? []).filter((fn) => {
        return fn !== handler;
      })
    );
  } else if (tabId && type) {
    HANDLERS[type].delete(tabId);
  } else if (type) {
    HANDLERS[type].clear();
  } else {
    Object.values(HANDLERS).forEach((map) => {
      map.clear();
    });
  }
};

function useOnTabDestroyHandler(
  type: 'close' | 'replace',
  handler: WorkspaceDestroyHandler
) {
  const tabId = useWorkspaceTabId();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const onClose: WorkspaceDestroyHandler = () => {
      return handlerRef.current();
    };
    return setTabDestroyHandler(type, tabId, onClose);
  }, [type, tabId]);
}

/**
 * A hook that registers a tab close handler. Before closing the tab, this
 * handler will be called and can return either `true` to allow the tab to be
 * closed, or `false`, preventing tab to be closed before user confirms the tab
 * closure.
 *
 * Multiple handlers can be registered for one tab, they will be called in order
 * of registration and any one of them returning `false` will prevent the tab
 * from closing.
 *
 * @example
 * function TabWithInput() {
 *   const [value, setValue] = useState('');
 *   // Will prevent tab from closing if text input is not empty. This will
 *   // cause a confirmation modal to appear before closing the tab
 *   useOnTabClose(() => {
 *     return value !== '';
 *   });
 *   return <TextInput value={value} onChange={setValue} />
 * }
 */
export const useOnTabClose = useOnTabDestroyHandler.bind(null, 'close');

/**
 *
 * A hook that registers a tab replace handler. By default when opening a new
 * workspace, it will be opened in the same tab, destroying the content of the
 * current workspace. In that case, the registered handler can return either
 * `true` to allow the workspace to be destroyed, or `false` to prevent the tab
 * from being destroyed and forcing the new workspace to open in the new tab.
 *
 * Multiple handlers can be registered for one tab, they will be called in order
 * of registration and any one of them returning `false` will prevent the tab
 * from being replaced.
 *
 * @example
 * function TabWithInput() {
 *   const [value, setValue] = useState('');
 *   // Will prevent tab from being replaced if text input is not empty. This
 *   // will cause new workspace to open in a new tab
 *   useOnTabReplace(() => {
 *     return value !== '';
 *   });
 *   return <TextInput value={value} onChange={setValue} />
 * }
 */
export const useOnTabReplace = useOnTabDestroyHandler.bind(null, 'replace');

export function useRegisterTabDestroyHandler() {
  let tabId: string | undefined;
  try {
    // We are not breaking rules of hooks here, this method will either always
    // fail or always return a value when rendered in a certain spot in the
    // application
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tabId = useWorkspaceTabId();
  } catch {
    // do nothing, we are just outside of the workspace tab tree
  }

  if (tabId) {
    return {
      onTabClose: setTabDestroyHandler.bind(null, 'close', tabId),
      onTabReplace: setTabDestroyHandler.bind(null, 'replace', tabId),
    };
  }
}
