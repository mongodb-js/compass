/* eslint-disable react/prop-types */
import React, { useCallback, useState, useRef } from 'react';
import { Menu, MenuItem } from '../index';

import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';

import { IconButtonSmall } from './icon-button';
import type { IconMode } from './icon-button';

export type ItemAction<Actions> = {
  action: Actions;
  label: string;
  icon: string;
};

const actionControls = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
});

const actionIconButton = css({
  '&:not(:first-child)': {
    marginLeft: spacing[1],
  },
});

export function ItemActionControls<Actions extends string>({
  mode = 'hovered',
  actions,
  onAction,
  className,
  iconClassName,
  isActive,
  isHovered,
  shouldCollapseActionsToMenu = false,
}: {
  mode: IconMode;
  actions: ItemAction<Actions>[];
  onAction(actionName: Actions): void;
  className?: string;
  iconClassName?: string;
  isActive: boolean;
  isHovered: boolean;
  shouldCollapseActionsToMenu?: boolean;
}) {
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      onAction(evt.currentTarget.dataset.action);
      if (evt.currentTarget.dataset.menuitem && menuTriggerRef.current) {
        setIsMenuOpen(false);
        // Workaround for https://jira.mongodb.org/browse/PD-1674
        menuTriggerRef.current.focus();
      }
    },
    [onAction]
  );

  if (
    actions.length === 0 ||
    (!isActive && !isHovered && !isMenuOpen && mode === 'hovered')
  ) {
    return null;
  }

  const shouldShowMenu = shouldCollapseActionsToMenu && actions.length > 1;

  if (shouldShowMenu) {
    return (
      <div className={cx(actionControls, className)}>
        <Menu
          open={isMenuOpen}
          setOpen={setIsMenuOpen}
          trigger={({
            onClick,
            children,
          }: {
            onClick(): void;
            children: React.ReactChildren;
          }) => (
            <IconButtonSmall
              ref={menuTriggerRef}
              glyph="Ellipsis"
              mode={mode}
              label="Show actions"
              title="Show actions"
              data-testid="show-actions"
              onClick={(evt) => {
                evt.stopPropagation();
                onClick();
              }}
              className={cx(actionIconButton, iconClassName)}
            >
              {children}
            </IconButtonSmall>
          )}
        >
          {actions.map(({ action, label }) => {
            return (
              <MenuItem
                key={action}
                data-testid={action}
                data-action={action}
                data-menuitem={true}
                onClick={onClick}
              >
                {label}
              </MenuItem>
            );
          })}
        </Menu>
      </div>
    );
  }

  return (
    <div className={cx(actionControls, className)}>
      {actions.map(({ action, icon, label }) => {
        return (
          <IconButtonSmall
            key={action}
            glyph={icon}
            mode={mode}
            label={label}
            title={label}
            data-action={action}
            onClick={onClick}
            className={cx(actionIconButton, iconClassName)}
          ></IconButtonSmall>
        );
      })}
    </div>
  );
}
