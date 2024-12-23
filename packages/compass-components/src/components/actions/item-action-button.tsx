import React from 'react';
import { cx } from '@leafygreen-ui/emotion';

import { ItemActionButtonSize } from './constants';
import type { ItemComponentProps } from './types';
import { SmallIconButton } from './small-icon-button';

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
      className={cx(iconClassName, className)}
      style={iconStyle}
      disabled={isDisabled}
    />
  );
}
