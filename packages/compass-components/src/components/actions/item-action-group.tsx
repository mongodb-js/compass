import React, { useCallback } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { MenuSeparator, Tooltip } from '../leafygreen';

import { ItemActionButtonSize } from './constants';
import type { ItemAction, ItemSeparator } from './types';
import { ItemActionButton } from './item-action-button';
import { actionTestId, isSeparatorMenuAction } from './utils';

export type GroupedItemAction<Action extends string> = ItemAction<Action> & {
  tooltipProps?: Parameters<typeof Tooltip>;
};

const containerStyle = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
  gap: spacing[100],
});

export type ItemActionGroupProps<Action extends string> = {
  actions: (GroupedItemAction<Action> | ItemSeparator)[];
  onAction(actionName: Action): void;
  isVisible?: boolean;
  /**
   * Called to signal to the parent if the component wants to prevent becoming hidden.
   * Note: In the current implementation, this is called when a menu is opened.
   */
  setHidable?(hidable: boolean): void;
  className?: string;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  iconSize?: ItemActionButtonSize;
  'data-testid'?: string;
};

export function ItemActionGroup<Action extends string>({
  actions,
  onAction,
  isVisible = true,
  setHidable,
  className,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  'data-testid': dataTestId,
}: ItemActionGroupProps<Action>) {
  const onClick: React.MouseEventHandler<HTMLElement> = useCallback(
    (evt) => {
      evt.stopPropagation();
      const actionName = evt.currentTarget.dataset.action;
      if (typeof actionName !== 'string') {
        throw new Error('Expected element to have a "data-action" attribute');
      }
      onAction(actionName as Action);
    },
    [onAction]
  );

  if (!isVisible || actions.length === 0) {
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
            data-testid={actionTestId(dataTestId, itemProps.action)}
            setHidable={setHidable}
          />
        );

        if (tooltip) {
          return (
            <Tooltip
              key={itemProps.action}
              {...tooltipProps}
              // Wrapping the item in a div, because the `trigger` must accept and render `children`
              // See docs for the prop for more information
              trigger={<div style={{ display: 'inherit' }}>{item}</div>}
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
