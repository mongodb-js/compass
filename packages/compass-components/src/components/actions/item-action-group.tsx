import React, { useCallback } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { MenuSeparator, Tooltip } from '../leafygreen';

import { ItemActionButtonSize } from './constants';
import type { ItemAction, ItemSeparator } from './types';
import { isSeparatorMenuAction } from './item-action-menu';
import { ItemActionButton } from './item-action-button';
import { actionTestId } from './utils';

export type GroupedItemAction<Action extends string> = ItemAction<Action> & {
  tooltipProps?: Parameters<typeof Tooltip>;
};

const containerStyle = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
});

// TODO: Move to a parent component - or a flex gap
const actionGroupButtonStyle = css({
  '&:not(:first-child)': {
    marginLeft: spacing[100],
  },
});

export type ItemActionGroupProps<Action extends string> = {
  actions: (GroupedItemAction<Action> | ItemSeparator)[];
  onAction(actionName: Action): void;
  className?: string;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  iconSize?: ItemActionButtonSize;
  isVisible?: boolean;
  'data-testid'?: string;
};

export function ItemActionGroup<Action extends string>({
  actions,
  onAction,
  className,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  isVisible = true,
  'data-testid': dataTestId,
}: ItemActionGroupProps<Action>) {
  const onClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      onAction(evt.currentTarget.dataset.action);
    },
    [onAction]
  );

  const shouldRender = isVisible && actions.length > 0;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={cx(containerStyle, className)} data-testid={dataTestId}>
      {actions.map((menuItem, idx) => {
        if (isSeparatorMenuAction(menuItem)) {
          return <MenuSeparator key={`separator-${idx}`} />;
        }

        const {
          expandedAs: ItemComponent = ItemActionButton,
          tooltip,
          tooltipProps,
          ...itemProps
        } = menuItem;

        const item = (
          <ItemComponent
            key={itemProps.action}
            {...itemProps}
            iconSize={iconSize}
            iconStyle={iconStyle}
            iconClassName={iconClassName}
            onClick={onClick}
            data-testid={actionTestId<Action>(dataTestId, itemProps.action)}
          />
        );

        if (tooltip) {
          return (
            <Tooltip
              key={itemProps.action}
              {...tooltipProps}
              trigger={
                <div
                  className={actionGroupButtonStyle}
                  style={{ display: 'inherit' }}
                >
                  {item}
                </div>
              }
            >
              {tooltip}
            </Tooltip>
          );
        }

        return item;
      })}
    </div>
  );
}
