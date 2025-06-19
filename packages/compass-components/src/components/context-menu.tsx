import React, { useEffect, useMemo } from 'react';
import { Menu, MenuItem, MenuSeparator } from './leafygreen';
import type { ContextMenuItem } from '@mongodb-js/compass-context-menu';
import { useContextMenu } from '@mongodb-js/compass-context-menu';
import { ContextMenuProvider as ContextMenuProviderBase } from '@mongodb-js/compass-context-menu';
import type {
  ContextMenuItemGroup,
  ContextMenuWrapperProps,
} from '@mongodb-js/compass-context-menu';

export function ContextMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContextMenuProviderBase menuWrapper={ContextMenu}>
      {children}
    </ContextMenuProviderBase>
  );
}

export function ContextMenu({ menu }: ContextMenuWrapperProps) {
  const position = menu.position;
  const itemGroups = menu.itemGroups;

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
        pointerEvents: 'all',
        left: position.x,
        top: position.y,
      }}
    >
      <Menu
        renderMode="inline"
        open={menu.isOpen}
        setOpen={menu.close}
        justify="start"
      >
        {itemGroups.map(
          (itemGroup: ContextMenuItemGroup, groupIndex: number) => {
            return (
              <div
                key={`menu-group-${groupIndex}`}
                data-testid={`menu-group-${groupIndex}`}
              >
                {itemGroup.items.map(
                  (item: ContextMenuItem, itemIndex: number) => {
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
                  }
                )}
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
          }
        )}
      </Menu>
    </div>
  );
}

export function useContextMenuItems(
  getItems: () => ContextMenuItem[],
  dependencies: React.DependencyList | undefined
): React.RefCallback<HTMLElement> {
  const memoizedItems = useMemo(getItems, dependencies);
  const contextMenu = useContextMenu();
  return contextMenu.registerItems(memoizedItems);
}
