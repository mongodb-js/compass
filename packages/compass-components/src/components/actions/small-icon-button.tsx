import React, { forwardRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import type { IconButtonProps } from '@leafygreen-ui/icon-button';

import { IconButton } from '../leafygreen';

import type { ItemActionButtonSize } from './constants';
import { ActionGlyph } from './action-glyph';

const iconContainerStyle = css({
  display: 'block',
  flex: 'none',
  fontSize: 0,
  lineHeight: 0,
});

// Using important here because leafygreen / emotion applies styles in the order
// that doesn't allow our styles override theirs
const buttonSizeStyle: Record<ItemActionButtonSize, string | undefined> = {
  default: undefined,
  small: css({
    flex: 'none',
    width: `${spacing[600]}px !important`,
    height: `${spacing[600]}px !important`,
  }),
  xsmall: css({
    flex: 'none',
    // aligns with other xsmall components
    width: `${20}px !important`,
    height: `${20}px !important`,
  }),
};

export type SmallIconButtonProps = {
  glyph: React.ReactChild;
  label: string;
  size: ItemActionButtonSize;
} & Omit<IconButtonProps, 'size'>;

export const SmallIconButton = forwardRef<
  HTMLButtonElement,
  SmallIconButtonProps
>(function SmallIconButton(
  { glyph, size, label, children, className, ...rest },
  ref
) {
  return (
    <IconButton
      ref={ref}
      className={cx(buttonSizeStyle[size], className)}
      aria-label={label}
      {...rest}
    >
      <span role="presentation" className={iconContainerStyle}>
        <ActionGlyph glyph={glyph} size={size} />
      </span>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
});
