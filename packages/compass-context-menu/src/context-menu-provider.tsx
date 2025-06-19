import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  createContext,
  useContext,
} from 'react';
import type { ContextMenuContextType, ContextMenuState } from './types';
import type { EnhancedMouseEvent } from './context-menu-content';
import { getContextMenuContent } from './context-menu-content';

export const ContextMenuContext = createContext<ContextMenuContextType | null>(
  null
);

export function ContextMenuProvider({
  children,
  menuWrapper,
}: {
  children: React.ReactNode;
  menuWrapper: React.ComponentType<{
    menu: ContextMenuState & { close: () => void };
  }>;
}) {
  // Check if there's already a parent context menu provider
  const parentContext = useContext(ContextMenuContext);

  // Prevent accidental nested providers
  if (parentContext) {
    throw new Error(
      'Duplicated ContextMenuProvider found. Please remove the nested provider.'
    );
  }

  const [menu, setMenu] = useState<ContextMenuState>({
    isOpen: false,
    itemGroups: [],
    position: { x: 0, y: 0 },
  });
  const close = useCallback(() => setMenu({ ...menu, isOpen: false }), [menu]);

  const handleClosingEvent = useCallback(
    (event: Event) => {
      if (!event.defaultPrevented) {
        setMenu({ ...menu, isOpen: false });
      }
    },
    [menu]
  );

  useEffect(() => {
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

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleClosingEvent);
    };
  }, [handleClosingEvent]);

  const value = useMemo(
    () => ({
      close,
    }),
    [close]
  );

  const Wrapper = menuWrapper ?? React.Fragment;

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      <Wrapper menu={{ ...menu, close }} />
    </ContextMenuContext.Provider>
  );
}
