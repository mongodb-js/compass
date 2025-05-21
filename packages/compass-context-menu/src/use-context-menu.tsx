import React, { useContext, useMemo, useRef } from 'react';
import { Context } from './context-menu-provider';
import { appendContextMenuContent } from './context-menu-content';
import type { MenuItem } from './types';

/**
 * @returns an object with methods to {@link register} content for the menu and {@link close} the menu
 */
export function useContextMenu<T extends MenuItem>({
  Menu,
}: {
  Menu: React.ComponentType<{
    items: T[];
  }>;
}) {
  // Get the close function from the ContextProvider
  const context = useContext(Context);
  const previous = useRef<null | [HTMLElement, (event: MouseEvent) => void]>(
    null
  );

  return useMemo(() => {
    if (!context) {
      throw new Error('useContextMenu called outside of the provider');
    }

    return {
      close: context.close.bind(context),
      /**
       * @returns a callback ref, passed onto the element responsible for triggering the menu.
       */
      register(content: React.ComponentType) {
        function listener(event: MouseEvent) {
          appendContextMenuContent(event, content);
        }
        return (trigger: HTMLElement | null) => {
          if (previous.current) {
            const [previousTrigger, previousListener] = previous.current;
            previousTrigger.removeEventListener(
              'contextmenu',
              previousListener
            );
          }
          if (trigger) {
            trigger.addEventListener('contextmenu', listener);
            previous.current = [trigger, listener];
          }
        };
      },
      registerItems(items: T[]) {
        return this.register(() => <Menu items={items} />);
      },
    };
  }, [context, Menu]);
}
