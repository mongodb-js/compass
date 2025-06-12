import type { RefCallback } from 'react';
import { useContext, useMemo, useRef } from 'react';
import { Context } from './context-menu-provider';
import { appendContextMenuContent } from './context-menu-content';
import type { ContextMenuItem } from './types';

export type ContextMenuMethods<T extends ContextMenuItem> = {
  /**
   * Close the context menu.
   */
  close: () => void;
  /**
   * Register the menu items for the context menu.
   * @returns a callback ref to be passed onto the element responsible for triggering the menu.
   */
  registerItems: (items: T[]) => RefCallback<HTMLElement>;
};

export function useContextMenu<
  T extends ContextMenuItem = ContextMenuItem
>(): ContextMenuMethods<T> {
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
      registerItems(items: ContextMenuItem[]) {
        function listener(event: MouseEvent): void {
          appendContextMenuContent(event, {
            items,
            originListener: listener,
          });
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
    };
  }, [context]);
}
