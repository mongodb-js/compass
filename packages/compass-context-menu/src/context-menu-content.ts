const CONTEXT_MENUS_SYMBOL = Symbol('context_menus');

export type EnhancedMouseEvent = MouseEvent & {
  [CONTEXT_MENUS_SYMBOL]?: React.ComponentType[];
};

export function getContextMenuContent(
  event: EnhancedMouseEvent
): React.ComponentType[] {
  return event[CONTEXT_MENUS_SYMBOL] ?? [];
}

export function appendContextMenuContent(
  event: EnhancedMouseEvent,
  content: React.ComponentType
) {
  // Initialize if not already patched
  if (event[CONTEXT_MENUS_SYMBOL] === undefined) {
    event[CONTEXT_MENUS_SYMBOL] = [content];
    return;
  }
  event[CONTEXT_MENUS_SYMBOL].push(content);
}
