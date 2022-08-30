import { useRef } from 'react';
import React, { useCallback, useState } from 'react';

import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';

import type { IconMode } from './item-action-button';
import { ItemActionButton, ItemActionButtonSize } from './item-action-button';
import { Menu, MenuItem } from '@leafygreen-ui/menu';

export type ItemAction<Actions> = {
  action: Actions;
  label: string;
  icon: string;
};

export type MenuAction<Actions> = {
  action: Actions;
  label: string;
};

const actionControlsStyle = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
});

const ItemActionButtonStyle = css({
  '&:not(:first-child)': {
    marginLeft: spacing[1],
  },
});

export function ItemActionMenu<Actions extends string>({
  mode = 'hovered',
  actions,
  onAction,
  className,
  iconClassName,
  iconSize = ItemActionButtonSize.Default,
  isActive,
  isHovered,
}: {
  mode: IconMode;
  actions: MenuAction<Actions>[];
  onAction(actionName: Actions): void;
  className?: string;
  iconClassName?: string;
  iconSize?: ItemActionButtonSize;
  isActive: boolean;
  isHovered: boolean;
}) {
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      if (evt.currentTarget.dataset.menuitem) {
        setIsMenuOpen(false);
        // Workaround for https://jira.mongodb.org/browse/PD-1674
        menuTriggerRef.current?.focus();
      }
      onAction(evt.currentTarget.dataset.action);
    },
    [onAction]
  );

  if (
    actions.length === 0 ||
    (!isActive && !isHovered && !isMenuOpen && mode === 'hovered')
  ) {
    return null;
  }

  return (
    <div className={cx(actionControlsStyle, className)}>
      <Menu
        open={isMenuOpen}
        setOpen={setIsMenuOpen}
        refEl={menuTriggerRef}
        trigger={({
          onClick,
          children,
        }: {
          onClick: React.MouseEventHandler<HTMLButtonElement>;
          children: React.ReactNode;
        }) => {
          return (
            <ItemActionButton
              ref={menuTriggerRef}
              size={iconSize}
              glyph="Ellipsis"
              mode={mode}
              label="Show actions"
              title="Show actions"
              data-testid="show-actions"
              onClick={(evt) => {
                evt.stopPropagation();
                onClick && onClick(evt);
              }}
              className={cx(ItemActionButtonStyle, iconClassName)}
            >
              {children}
            </ItemActionButton>
          );
        }}
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

export function ItemActionGroup<Actions extends string>({
  mode = 'hovered',
  actions,
  onAction,
  className,
  iconClassName,
  iconSize = ItemActionButtonSize.Default,
  isActive,
  isHovered,
}: {
  mode: IconMode;
  actions: ItemAction<Actions>[];
  onAction(actionName: Actions): void;
  className?: string;
  iconClassName?: string;
  iconSize?: ItemActionButtonSize;
  isActive: boolean;
  isHovered: boolean;
  shouldCollapseActionsToMenu?: boolean;
}) {
  const onClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      onAction(evt.currentTarget.dataset.action);
    },
    [onAction]
  );

  if (actions.length === 0 || (!isActive && !isHovered && mode === 'hovered')) {
    return null;
  }

  return (
    <div className={cx(actionControlsStyle, className)}>
      {actions.map(({ action, icon, label }) => {
        return (
          <ItemActionButton
            key={action}
            glyph={icon}
            mode={mode}
            label={label}
            title={label}
            size={iconSize}
            data-action={action}
            onClick={onClick}
            className={cx(ItemActionButtonStyle, iconClassName)}
          ></ItemActionButton>
        );
      })}
    </div>
  );
}

export function ItemActionControls<Actions extends string>({
  mode = 'hovered',
  actions,
  onAction,
  className,
  iconClassName,
  iconSize = ItemActionButtonSize.Default,
  isActive,
  isHovered,
  shouldCollapseActionsToMenu = false,
}: {
  mode: IconMode;
  actions: ItemAction<Actions>[];
  onAction(actionName: Actions): void;
  className?: string;
  iconSize?: ItemActionButtonSize;
  iconClassName?: string;
  isActive: boolean;
  isHovered: boolean;
  shouldCollapseActionsToMenu?: boolean;
}) {
  if (actions.length === 0) {
    return null;
  }

  const shouldShowMenu = shouldCollapseActionsToMenu && actions.length > 1;

  if (shouldShowMenu) {
    return (
      <ItemActionMenu
        mode={mode}
        actions={actions}
        onAction={onAction}
        className={className}
        iconSize={iconSize}
        iconClassName={iconClassName}
        isActive={isActive}
        isHovered={isHovered}
      ></ItemActionMenu>
    );
  }

  return (
    <ItemActionGroup
      mode={mode}
      actions={actions}
      onAction={onAction}
      className={className}
      iconSize={iconSize}
      iconClassName={iconClassName}
      isActive={isActive}
      isHovered={isHovered}
    ></ItemActionGroup>
  );
}
