import React, { useCallback, useRef, useState } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { Menu, MenuItem, MenuSeparator } from '../leafygreen';

import { ItemActionButtonSize } from './constants';
import { ActionGlyph } from './action-glyph';
import type { ItemBase, ItemSeparator } from './types';
import { SmallIconButton } from './small-icon-button';
import { actionTestId } from './utils';

export type MenuAction<Action extends string> =
  | ItemBase<Action>
  | ItemSeparator;

export function isSeparatorMenuAction(value: unknown): value is ItemSeparator {
  return (
    typeof value === 'object' &&
    value !== null &&
    'separator' in value &&
    value.separator === true
  );
}

const containerStyle = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
});

// TODO: Move to a parent component - or a flex gap
const buttonStyle = css({
  '&:not(:first-child)': {
    marginLeft: spacing[100],
  },
});

export type ItemActionMenuProps<Action extends string> = {
  actions: MenuAction<Action>[];
  onAction(actionName: Action): void;
  // TODO: Merge className and menuClassName
  className?: string;
  menuClassName?: string;
  usePortal?: boolean;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  iconSize?: ItemActionButtonSize;
  isVisible?: boolean;
  'data-testid'?: string;
};

export function ItemActionMenu<Action extends string>({
  isVisible = true,
  actions,
  onAction,
  className,
  menuClassName,
  usePortal,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  'data-testid': dataTestId,
}: ItemActionMenuProps<Action>) {
  // this ref is used by the Menu component to calculate the height and position
  // of the menu, and by us to give back the focus to the trigger when the menu
  // is closed (https://jira.mongodb.org/browse/PD-1674).
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

  const shouldRender = isMenuOpen || (isVisible && actions.length > 0);

  if (!shouldRender) {
    return null;
  }

  // TODO: Remove the wrapping div
  return (
    <div className={cx(containerStyle, className)}>
      <Menu
        className={menuClassName}
        open={isMenuOpen}
        setOpen={setIsMenuOpen}
        refEl={menuTriggerRef}
        usePortal={usePortal}
        data-testid={dataTestId}
        trigger={({
          onClick,
          children,
        }: {
          onClick: React.MouseEventHandler<HTMLButtonElement>;
          children: React.ReactNode;
        }) => {
          return (
            <SmallIconButton
              ref={menuTriggerRef}
              size={iconSize}
              glyph="Ellipsis"
              label="Show actions"
              title="Show actions"
              data-testid={
                dataTestId ? `${dataTestId}-show-actions` : undefined
              }
              onClick={(evt) => {
                evt.stopPropagation();
                onClick && onClick(evt);
              }}
              className={cx(buttonStyle, iconClassName)}
              style={iconStyle}
            >
              {children}
            </SmallIconButton>
          );
        }}
      >
        {actions.map((menuAction, idx) => {
          if (isSeparatorMenuAction(menuAction)) {
            return <MenuSeparator key={`separator-${idx}`} />;
          }

          const {
            action,
            label,
            icon,
            variant,
            isDisabled,
            disabledDescription,
          } = menuAction;

          return (
            <MenuItem
              key={action}
              data-testid={actionTestId<Action>(dataTestId, action)}
              data-action={action}
              data-menuitem={true}
              glyph={<ActionGlyph glyph={icon} size={iconSize} />}
              onClick={onClick}
              variant={variant || 'default'}
              disabled={isDisabled}
              description={isDisabled ? disabledDescription : ''}
            >
              {label}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}
