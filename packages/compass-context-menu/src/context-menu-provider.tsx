import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  createContext,
  useContext,
} from 'react';

import type { ContextMenuContextType, ContextMenuState } from './types';
import {
  getContextMenuContent,
  type EnhancedMouseEvent,
} from './context-menu-content';

export const ContextMenuContext = createContext<ContextMenuContextType | null>(
  null
);

export function ContextMenuProvider({
  disabled = false,
  children,
  menuWrapper: Wrapper,
}: {
  disabled?: boolean;
  children: React.ReactNode;
  menuWrapper: React.ComponentType<{
    menu: ContextMenuState & { close: () => void };
  }>;
}) {
  // Check if there's already a parent context menu provider
  const parentContext = useContext(ContextMenuContext);

  const [menu, setMenu] = useState<ContextMenuState>({
    isOpen: false,
    itemGroups: [],
    position: { x: 0, y: 0 },
  });
  const close = useCallback(
    () => setMenu((prev) => ({ ...prev, isOpen: false })),
    [setMenu]
  );

  const handleClosingEvent = useCallback(
    (event: Event) => {
      if (!event.defaultPrevented) {
        close();
      }
    },
    [close]
  );

  useEffect(() => {
    // Don't set up event listeners if we have a parent context
    if (parentContext || disabled) return;

    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();

      const itemGroups = getContextMenuContent(event as EnhancedMouseEvent);

      if (itemGroups.length === 0) {
        return;
      }

      setMenu({
        isOpen: true,
        itemGroups,
        position: {
          // TODO: Fix handling offset while scrolling
          x: event.clientX,
          y: event.clientY,
        },
      });
    }

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', handleClosingEvent);
    window.addEventListener('scroll', handleClosingEvent, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleClosingEvent);
      window.removeEventListener('scroll', handleClosingEvent, {
        capture: true,
      });
    };
  }, [disabled, handleClosingEvent, parentContext]);

  const value = useMemo(
    () => ({
      close,
    }),
    [close]
  );

  // If we have a parent context, just render children without the wrapper
  if (parentContext) {
    return <>{children}</>;
  }

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      <Wrapper menu={{ ...menu, close }} />
    </ContextMenuContext.Provider>
  );
}
