import React, { useCallback, useEffect, useRef, useState } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import type { RenderMode } from '@leafygreen-ui/popover';

import { Menu, MenuItem, MenuSeparator } from '../leafygreen';

import { ItemActionButtonSize } from './constants';
import { ActionGlyph } from './action-glyph';
import type { MenuAction } from './types';
import { SmallIconButton } from './small-icon-button';
import { actionTestId, isSeparatorMenuAction } from './utils';

const containerStyle = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
});

export type ItemActionMenuProps<Action extends string> = {
  actions: MenuAction<Action>[];
  isVisible?: boolean;
  /**
   * Called to signal to the parent if the component wants to prevent becoming hidden.
   * Note: In the current implementation, this is called when a menu is opened.
   */
  setHidable?(hideable: boolean): void;
  onAction(actionName: Action): void;
  // TODO: Merge className and menuClassName
  className?: string;
  menuClassName?: string;
  renderMode?: RenderMode;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  iconSize?: ItemActionButtonSize;
  'data-testid'?: string;
};

export function ItemActionMenu<Action extends string>({
  actions,
  isVisible = true,
  setHidable,
  onAction,
  className,
  menuClassName,
  renderMode,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  'data-testid': dataTestId,
}: ItemActionMenuProps<Action>) {
  // This ref is used by the Menu component to calculate the height and position
  // of the menu.
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onClick: React.MouseEventHandler<HTMLElement> = useCallback(
    (evt) => {
      evt.stopPropagation();
      if (evt.currentTarget.dataset.menuitem) {
        setIsMenuOpen(false);
      }
      const actionName = evt.currentTarget.dataset.action;
      if (typeof actionName !== 'string') {
        throw new Error('Expected element to have a "data-action" attribute');
      }
      onAction(actionName as Action);
    },
    [onAction]
  );

  // Opening the menu should keep it visible
  useEffect(() => {
    if (setHidable) {
      setHidable(!isMenuOpen);
    }
  }, [setHidable, isMenuOpen]);

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
        renderMode={renderMode}
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
                onClick?.(evt);
              }}
              className={iconClassName}
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
              data-testid={actionTestId(dataTestId, action)}
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
