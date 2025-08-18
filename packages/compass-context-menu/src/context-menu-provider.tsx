import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  createContext,
  useContext,
  useRef,
} from 'react';

import type {
  ContextMenuContextType,
  ContextMenuItemGroup,
  ContextMenuState,
} from './types';
import {
  getContextMenuContent,
  type EnhancedMouseEvent,
} from './context-menu-content';
import { contextMenuClassName } from './consts';

export const ContextMenuContext = createContext<ContextMenuContextType | null>(
  null
);

export function ContextMenuProvider({
  disabled = false,
  children,
  menuWrapper: Wrapper,
  onContextMenuOpen,
}: {
  disabled?: boolean;
  children: React.ReactNode;
  menuWrapper: React.ComponentType<{
    menu: ContextMenuState & { close: () => void };
  }>;
  onContextMenuOpen?: (itemGroups: ContextMenuItemGroup[]) => void;
}) {
  // Check if there's already a parent context menu provider
  const parentContext = useContext(ContextMenuContext);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [menu, setMenu] = useState<ContextMenuState>({
    isOpen: false,
    itemGroups: [],
    position: { x: 0, y: 0 },
  });
  const close = useCallback(
    () => setMenu((prev) => ({ ...prev, isOpen: false })),
    [setMenu]
  );

  const onContextMenuOpenRef = useRef(onContextMenuOpen);
  onContextMenuOpenRef.current = onContextMenuOpen;

  const handleClosingEvent = useCallback(
    (event: Event) => {
      if (!event.defaultPrevented) {
        close();
      }
    },
    [close]
  );

  useEffect(() => {
    // We skip registering listeners when parentContext is known to avoid registering multiple (nested) listeners
    const { current: container } = containerRef;
    if (parentContext || disabled || !container) return;

    function handleContextMenu(event: MouseEvent) {
      const itemGroups = getContextMenuContent(event as EnhancedMouseEvent);
      if (itemGroups.length === 0 || event.shiftKey) {
        return;
      }

      event.preventDefault();
      onContextMenuOpenRef.current?.(itemGroups);

      setMenu({
        isOpen: true,
        itemGroups,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
      });
    }

    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', handleClosingEvent);
    window.addEventListener(
      'scroll',
      (e) => {
        const isCompassContextMenu =
          e.target instanceof HTMLElement &&
          e.target.classList.contains(contextMenuClassName);
        if (!isCompassContextMenu) handleClosingEvent(e);
      },
      { capture: true }
    );

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleClosingEvent);
      window.removeEventListener('scroll', handleClosingEvent, {
        capture: true,
      });
    };
  }, [
    disabled,
    containerRef,
    handleClosingEvent,
    onContextMenuOpenRef,
    parentContext,
  ]);

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
      <div ref={containerRef} style={{ display: 'contents' }}>
        {children}
      </div>
      <Wrapper menu={{ ...menu, close }} />
    </ContextMenuContext.Provider>
  );
}
