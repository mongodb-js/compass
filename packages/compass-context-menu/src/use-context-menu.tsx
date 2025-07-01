import type { RefCallback } from 'react';
import { useContext, useMemo, useRef } from 'react';
import { ContextMenuContext } from './context-menu-provider';
import { appendContextMenuContent } from './context-menu-content';
import type { ContextMenuItem } from './types';

export type ContextMenuMethods<T extends ContextMenuItem> = {
  /**
   * Close the context menu.
   */
  close(): void;
  /**
   * Register the menu items for the context menu.
   * @returns a callback ref to be passed onto the element responsible for triggering the menu.
   */
  registerItems(...groups: T[][]): RefCallback<HTMLElement>;
};

export function useContextMenu<
  T extends ContextMenuItem = ContextMenuItem
>(): ContextMenuMethods<T> {
  const context = useContext(ContextMenuContext);
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
      registerItems(...groups: ContextMenuItem[][]) {
        function listener(event: MouseEvent): void {
          appendContextMenuContent(event, ...groups);
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
