import type { ContextMenuItemGroup } from './types';

const CONTEXT_MENUS_SYMBOL = Symbol('context_menus');

export type EnhancedMouseEvent = MouseEvent & {
  [CONTEXT_MENUS_SYMBOL]?: ContextMenuItemGroup[];
};

export function getContextMenuContent(
  event: EnhancedMouseEvent
): ContextMenuItemGroup[] {
  return event[CONTEXT_MENUS_SYMBOL] ?? [];
}

export function appendContextMenuContent(
  event: EnhancedMouseEvent,
  ...groups: ContextMenuItemGroup[]
) {
  // Initialize if not already patched
  if (!event[CONTEXT_MENUS_SYMBOL]) {
    event[CONTEXT_MENUS_SYMBOL] = [];
  }
  event[CONTEXT_MENUS_SYMBOL].push(...groups);
}
