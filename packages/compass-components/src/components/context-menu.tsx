import React, { useEffect, useMemo, useRef } from 'react';
import { Menu, MenuItem, MenuSeparator } from './leafygreen';

import {
  ContextMenuProvider as ContextMenuProviderBase,
  useContextMenu,
  type ContextMenuItem,
  type ContextMenuItemGroup,
  type ContextMenuWrapperProps,
} from '@mongodb-js/compass-context-menu';

export type { ContextMenuItem } from '@mongodb-js/compass-context-menu';

export function ContextMenuProvider({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <ContextMenuProviderBase disabled={disabled} menuWrapper={ContextMenu}>
      {children}
    </ContextMenuProviderBase>
  );
}

export function ContextMenu({ menu }: ContextMenuWrapperProps) {
  const menuRef = useRef(null);

  const { position, itemGroups } = menu;

  useEffect(() => {
    if (!menu.isOpen) {
      menu.close();
    }
  }, [menu.isOpen]);

  return (
    <div
      data-testid="context-menu"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        // This is to ensure the menu gets positioned correctly as the left and top updates
        width: 1,
        height: 1,
      }}
    >
      <Menu
        ref={menuRef}
        open={menu.isOpen}
        setOpen={menu.close}
        justify="start"
      >
        {itemGroups.map((items: ContextMenuItemGroup, groupIndex: number) => {
          return (
            <div
              key={`menu-group-${groupIndex}`}
              data-testid={`menu-group-${groupIndex}`}
            >
              {items.map((item: ContextMenuItem, itemIndex: number) => {
                return (
                  <MenuItem
                    key={`menu-group-${groupIndex}-item-${itemIndex}`}
                    data-text={item.label}
                    data-testid={`menu-group-${groupIndex}-item-${itemIndex}`}
                    onClick={(evt: React.MouseEvent) => {
                      item.onAction?.(evt);
                      menu.close();
                    }}
                  >
                    {item.label}
                  </MenuItem>
                );
              })}
              {groupIndex < itemGroups.length - 1 && (
                <div
                  key={`menu-group-${groupIndex}-separator`}
                  data-testid={`menu-group-${groupIndex}-separator`}
                >
                  <MenuSeparator />
                </div>
              )}
            </div>
          );
        })}
      </Menu>
    </div>
  );
}

export function useContextMenuItems(
  getItems: () => ContextMenuItem[],
  dependencies: React.DependencyList | undefined
): React.RefCallback<HTMLElement> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedItems = useMemo(getItems, dependencies);
  const contextMenu = useContextMenu();
  return contextMenu.registerItems(memoizedItems);
}

export function useContextMenuGroups(
  getGroups: () => ContextMenuItemGroup[],
  dependencies: React.DependencyList | undefined
): React.RefCallback<HTMLElement> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedGroups = useMemo(getGroups, dependencies);
  const contextMenu = useContextMenu();
  return contextMenu.registerItems(...memoizedGroups);
}
