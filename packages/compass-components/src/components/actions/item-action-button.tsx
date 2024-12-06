import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { ItemActionButtonSize } from './constants';
import type { ItemComponentProps } from './types';
import { SmallIconButton } from './small-icon-button';

// TODO: Move to a parent component - or a flex gap
const buttonStyle = css({
  '&:not(:first-child)': {
    marginLeft: spacing[100],
  },
});

export function ItemActionButton<Action extends string>({
  action,
  icon = <></>,
  label,
  tooltip,
  iconSize = ItemActionButtonSize.Default,
  onClick,
  iconClassName,
  className,
  iconStyle,
  isDisabled,
  'data-testid': dataTestId,
}: ItemComponentProps<Action>) {
  return (
    <SmallIconButton
      key={action}
      glyph={icon}
      label={label}
      title={!tooltip ? label : undefined}
      size={iconSize}
      data-action={action}
      data-testid={dataTestId}
      onClick={onClick}
      className={cx(buttonStyle, iconClassName, className)}
      style={iconStyle}
      disabled={isDisabled}
    />
  );
}
