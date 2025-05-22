import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { Menu, MenuItem, MenuSeparator } from './leafygreen';
import type { ContextMenuItem } from '@mongodb-js/compass-context-menu';
import { useContextMenu } from '@mongodb-js/compass-context-menu';

const menuStyle = css({
  position: 'fixed',
  zIndex: 9999,
});

export type ContextMenuProps = {
  items: ContextMenuItem[];
  className?: string;
  'data-testid'?: string;
};

export function ContextMenu({
  items,
  className,
  'data-testid': dataTestId,
}: ContextMenuProps) {
  return (
    <Menu className={cx(menuStyle, className)} data-testid={dataTestId}>
      {items.map((item, idx) => {
        const { label, onAction } = item;
        const isLastItem = idx === items.length - 1;

        return (
          <>
            {!isLastItem && <MenuSeparator />}
            <MenuItem
              key={`${label}-${idx}`}
              data-testid={`context-menu-item-${label}`}
              onClick={(evt: React.MouseEvent) => {
                evt.stopPropagation();
                onAction?.(evt);
              }}
            >
              {label}
            </MenuItem>
          </>
        );
      })}
    </Menu>
  );
}

export function useContextMenuItems(
  items: ContextMenuItem[]
): React.RefCallback<HTMLElement> {
  const contextMenu = useContextMenu({ Menu: ContextMenu });
  return contextMenu.registerItems(items);
}
