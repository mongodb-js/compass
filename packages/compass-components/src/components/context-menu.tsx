import React from 'react';
import { Menu, MenuItem, MenuSeparator } from './leafygreen';
import type { ContextMenuItem } from '@mongodb-js/compass-context-menu';
import { useContextMenu } from '@mongodb-js/compass-context-menu';
import { ContextMenuProvider as ContextMenuProviderBase } from '@mongodb-js/compass-context-menu';
import type { ContextMenuItemGroup } from '@mongodb-js/compass-context-menu/dist/types';

export function ContextMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContextMenuProviderBase wrapper={ContextMenu}>
      {children}
    </ContextMenuProviderBase>
  );
}

export type ContextMenuProps = {
  itemGroups: ContextMenuItemGroup[];
  className?: string;
  'data-testid'?: string;
};

export function ContextMenu({ itemGroups }: ContextMenuProps) {
  return (
    <Menu open={true} renderMode="inline">
      {itemGroups.map((itemGroup: ContextMenuItemGroup, groupIndex: number) => {
        return (
          <div key={`menu-group-${groupIndex}`}>
            {itemGroup.items.map((item: ContextMenuItem, itemIndex: number) => {
              return (
                <MenuItem
                  key={`menu-group-${groupIndex}-item-${itemIndex}`}
                  data-text={item.label}
                  data-testid={`context-menu-item-${item.label}`}
                  onClick={(evt: React.MouseEvent) => {
                    console.log('clicked', evt);
                    item.onAction?.(evt);
                  }}
                >
                  {item.label} {itemIndex} {groupIndex}
                </MenuItem>
              );
            })}
            {groupIndex < itemGroups.length - 1 && (
              <MenuSeparator key={`${groupIndex}-separator`} />
            )}
          </div>
        );
      })}
    </Menu>
  );
}

export function useContextMenuItems(
  items: ContextMenuItem[]
): React.RefCallback<HTMLElement> {
  const contextMenu = useContextMenu();
  return contextMenu.registerItems(items);
}
