import React, { useMemo, useRef } from 'react';
import { Menu, MenuItem, MenuSeparator } from './leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import {
  ContextMenuProvider as ContextMenuProviderBase,
  useContextMenu,
  type ContextMenuItem,
  type ContextMenuItemGroup,
  type ContextMenuWrapperProps,
} from '@mongodb-js/compass-context-menu';

export type {
  ContextMenuItem,
  ContextMenuItemGroup,
} from '@mongodb-js/compass-context-menu';

// TODO: Remove these once https://jira.mongodb.org/browse/LG-5013 is resolved

const menuStyles = css({
  paddingTop: spacing[150],
  paddingBottom: spacing[150],
});

const itemStyles = css({
  paddingTop: 0,
  paddingBottom: 0,
  fontSize: '.8em',
});

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
  const anchorRef = useRef<HTMLDivElement>(null);

  const { position, itemGroups } = menu;

  // TODO: Remove when https://jira.mongodb.org/browse/LG-5342 is resolved
  if (anchorRef.current) {
    anchorRef.current.style.left = `${position.x}px`;
    anchorRef.current.style.top = `${position.y}px`;
  }

  return (
    <div data-testid="context-menu-container">
      <div
        data-testid="context-menu-anchor"
        ref={anchorRef}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          // This is to ensure the menu gets positioned correctly as the left and top updates
          width: 1,
          height: 1,
        }}
      />
      <Menu
        data-testid="context-menu"
        refEl={anchorRef}
        ref={menuRef}
        open={menu.isOpen}
        setOpen={menu.close}
        justify="start"
        className={menuStyles}
        maxHeight={Number.MAX_SAFE_INTEGER}
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
                    className={itemStyles}
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
