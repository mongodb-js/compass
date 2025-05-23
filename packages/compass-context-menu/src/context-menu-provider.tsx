import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  createContext,
} from 'react';
import type {
  ContextMenuContext,
  ContextMenuItemGroup,
  ContextMenuState,
} from './types';
import { ContextMenu } from './compass-context-menu';
import type { EnhancedMouseEvent } from './context-menu-content';
import { getContextMenuContent } from './context-menu-content';

export const Context = createContext<ContextMenuContext | null>(null);

export function ContextMenuProvider({
  children,
  wrapper,
}: {
  children: React.ReactNode;
  wrapper: React.ComponentType<{ itemGroups: ContextMenuItemGroup[] }>;
}) {
  const [menu, setMenu] = useState<ContextMenuState>({ isOpen: false });
  const close = useCallback(() => setMenu({ isOpen: false }), [setMenu]);

  useEffect(() => {
    function handleContextMenu(event: MouseEvent) {
      console.log('handleContextMenu', event);
      event.preventDefault();

      setMenu({
        isOpen: true,
        itemGroups: getContextMenuContent(event as EnhancedMouseEvent),
        position: {
          // TODO: Fix handling offset while scrolling
          x: event.clientX,
          y: event.clientY,
        },
      });
    }

    function handleClosingEvent(event: Event) {
      console.log('handleClosingEvent', event);
      if (!event.defaultPrevented) {
        console.log('setting menu to false');
        setMenu({ isOpen: false });
      }
    }

    console.log('adding event listeners');
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClosingEvent);
    window.addEventListener('resize', handleClosingEvent);

    return () => {
      console.log('removing event listeners');
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClosingEvent);
      window.removeEventListener('resize', handleClosingEvent);
    };
  }, [setMenu]);

  const value = useMemo(
    () => ({
      close,
    }),
    [close]
  );

  const Wrapper = wrapper ?? React.Fragment;

  return (
    <Context.Provider value={value}>
      <>
        {children}
        {menu.isOpen && (
          <ContextMenu position={menu.position}>
            <Wrapper itemGroups={menu.itemGroups} />
          </ContextMenu>
        )}
      </>
    </Context.Provider>
  );
}
