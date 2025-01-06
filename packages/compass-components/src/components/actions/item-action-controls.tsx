import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import type { RenderMode } from '@leafygreen-ui/popover';

import { ItemActionMenu } from './item-action-menu';
import { ItemActionButtonSize } from './constants';
import type { ItemAction, ItemSeparator } from './types';
import { ItemActionGroup } from './item-action-group';

const actionControlsStyle = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
  gap: spacing[100],
});

export type ItemActionControlsProps<Action extends string> = {
  isVisible?: boolean;
  actions: (ItemAction<Action> | ItemSeparator)[];
  onAction(actionName: Action): void;
  className?: string;
  menuClassName?: string;
  iconSize?: ItemActionButtonSize;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  // The number of actions to show before collapsing other actions into a menu
  collapseAfter?: number;
  // When using `collapseAfter`, this option is not used.
  collapseToMenuThreshold?: number;
  renderMode?: RenderMode;
  'data-testid'?: string;
};

export function ItemActionControls<Action extends string>({
  isVisible = true,
  actions,
  onAction,
  className,
  menuClassName,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  renderMode,
  collapseAfter = 0,
  collapseToMenuThreshold = 2,
  'data-testid': dataTestId,
}: ItemActionControlsProps<Action>) {
  const sharedProps = {
    isVisible,
    onAction,
    className: cx('item-action-controls', className),
    iconClassName,
    iconStyle,
    iconSize,
    'data-testid': dataTestId,
  };
  const sharedMenuProps = {
    menuClassName,
    renderMode,
  };

  if (actions.length === 0) {
    return null;
  }

  // When user wants to show a few actions and collapse the rest into a menu
  if (collapseAfter > 0) {
    const visibleActions = actions.slice(0, collapseAfter);
    const collapsedActions = actions.slice(collapseAfter);
    return (
      <div className={actionControlsStyle}>
        <ItemActionGroup {...sharedProps} actions={visibleActions} />
        <ItemActionMenu
          {...sharedProps}
          {...sharedMenuProps}
          actions={collapsedActions}
        />
      </div>
    );
  }

  const shouldShowMenu = actions.length >= collapseToMenuThreshold;

  if (shouldShowMenu) {
    return (
      <ItemActionMenu actions={actions} {...sharedProps} {...sharedMenuProps} />
    );
  }

  return <ItemActionGroup actions={actions} {...sharedProps} />;
}
