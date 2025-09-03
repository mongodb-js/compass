import React, { useCallback, useRef, useState } from 'react';
import { css } from '@leafygreen-ui/emotion';
import type { ButtonProps } from '@leafygreen-ui/button';
import type { RenderMode } from '@leafygreen-ui/popover';

import { Button, Icon, Menu, MenuItem, MenuSeparator } from '../leafygreen';
import { WorkspaceContainer } from '../workspace-container';

import { ItemActionButtonSize } from './constants';
import { ActionGlyph } from './action-glyph';
import { actionTestId, isSeparatorMenuAction } from './utils';
import type { MenuAction } from './types';

const getHiddenOnNarrowStyles = (narrowBreakpoint: string) =>
  css({
    [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < ${narrowBreakpoint})`]:
      {
        display: 'none',
      },
  });

export type DropdownMenuButtonProps<Action extends string> = {
  actions: MenuAction<Action>[];
  onAction(actionName: Action): void;
  renderMode?: RenderMode;
  iconSize?: ItemActionButtonSize;
  isVisible?: boolean;
  activeAction?: Action;
  'data-testid'?: string;
  buttonText: string;
  buttonProps: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
  hideOnNarrow?: boolean;
  narrowBreakpoint?: string;
};

export function DropdownMenuButton<Action extends string>({
  isVisible = true,
  actions,
  onAction,
  renderMode,
  activeAction,
  buttonText,
  buttonProps,
  iconSize = ItemActionButtonSize.Default,
  'data-testid': dataTestId,
  hideOnNarrow = true,
  narrowBreakpoint = '900px',
}: DropdownMenuButtonProps<Action>) {
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

  const shouldRender = isMenuOpen || (isVisible && actions.length > 0);

  if (!shouldRender) {
    return null;
  }

  return (
    <Menu
      open={isMenuOpen}
      setOpen={setIsMenuOpen}
      justify="start"
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
          <Button
            ref={menuTriggerRef}
            data-testid={dataTestId ? `${dataTestId}-show-actions` : undefined}
            onClick={(evt) => {
              evt.stopPropagation();
              onClick?.(evt);
            }}
            rightGlyph={<Icon glyph={'CaretDown'} />}
            title={buttonText}
            {...buttonProps}
          >
            {buttonText && (
              <span
                className={
                  hideOnNarrow
                    ? getHiddenOnNarrowStyles(narrowBreakpoint)
                    : undefined
                }
              >
                {buttonText}
              </span>
            )}
            {children}
          </Button>
        );
      }}
    >
      {actions.map((menuAction, idx) => {
        if (isSeparatorMenuAction(menuAction)) {
          return <MenuSeparator key={`separator-${idx}`} />;
        }

        const { action, label, icon } = menuAction;
        return (
          <MenuItem
            active={activeAction === action}
            key={action}
            data-testid={actionTestId(dataTestId, action)}
            data-action={action}
            data-menuitem={true}
            glyph={
              icon ? <ActionGlyph glyph={icon} size={iconSize} /> : undefined
            }
            onClick={onClick}
          >
            {label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
