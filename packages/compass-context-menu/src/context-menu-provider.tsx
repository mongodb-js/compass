import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  createContext,
} from 'react';
import type { ContextMenuContext, MenuState } from './types';
import { ContextMenu } from './context-menu';
import type { EnhancedMouseEvent } from './context-menu-content';
import { getContextMenuContent } from './context-menu-content';

export const Context = createContext<ContextMenuContext | null>(null);

export function ContextMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState<MenuState>({ isOpen: false });
  const close = useCallback(() => setMenu({ isOpen: false }), [setMenu]);

  useEffect(() => {
    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
      setMenu({
        isOpen: true,
        children: getContextMenuContent(event as EnhancedMouseEvent).map(
          (Content, index) => <Content key={`menu-content-${index}`} />
        ),
        position: {
          // TODO: Fix handling offset while scrolling
          x: event.clientX,
          y: event.clientY,
        },
      });
    }

    function handleClosingEvent(event: Event) {
      if (!event.defaultPrevented) {
        setMenu({ isOpen: false });
      }
    }

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClosingEvent);
    window.addEventListener('resize', handleClosingEvent);

    return () => {
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

  return (
    <>
      <Context.Provider value={value}>{children}</Context.Provider>
      {menu.isOpen && (
        <ContextMenu position={menu.position}>{menu.children}</ContextMenu>
      )}
    </>
  );
}
