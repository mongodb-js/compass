import React, { useContext, useMemo, useRef } from 'react';
import { Context } from './context-menu-provider';
import { appendContextMenuContent } from './context-menu-content';
import type { MenuItem } from './types';

export type ContextMenuMethods<T extends MenuItem> = {
  /**
   * Close the context menu.
   */
  close: () => void;
  /**
   * Register the menu items for the context menu.
   * @returns a callback ref to be passed onto the element responsible for triggering the menu.
   */
  registerItems: (items: T[]) => (trigger: HTMLElement | null) => void;
};

export function useContextMenu<T extends MenuItem>({
  Menu,
}: {
  Menu: React.ComponentType<{
    items: T[];
  }>;
}): ContextMenuMethods<T> {
  // Get the close function from the ContextProvider
  const context = useContext(Context);
  const previous = useRef<null | [HTMLElement, (event: MouseEvent) => void]>(
    null
  );

  return useMemo(() => {
    if (!context) {
      throw new Error('useContextMenu called outside of the provider');
    }

    const register = (content: React.ComponentType) => {
      function listener(event: MouseEvent) {
        appendContextMenuContent(event, content);
      }
      return (trigger: HTMLElement | null) => {
        if (previous.current) {
          const [previousTrigger, previousListener] = previous.current;
          previousTrigger.removeEventListener('contextmenu', previousListener);
        }
        if (trigger) {
          trigger.addEventListener('contextmenu', listener);
          previous.current = [trigger, listener];
        }
      };
    };

    return {
      close: context.close.bind(context),
      /**
       * @returns a callback ref, passed onto the element responsible for triggering the menu.
       */
      registerItems(items: T[]) {
        return register(() => <Menu items={items} />);
      },
    };
  }, [context, Menu]);
}
