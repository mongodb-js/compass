import React, { forwardRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

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
    width: `${spacing[4]}px !important`,
    height: `${spacing[4]}px !important`,
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
  title?: string;
  size: ItemActionButtonSize;
  onClick(evt: React.MouseEvent<HTMLButtonElement>): void;
} & Omit<React.HTMLProps<HTMLButtonElement>, 'size'>;

export const SmallIconButton = forwardRef<
  HTMLButtonElement,
  SmallIconButtonProps
>(function SmallIconButton(
  { glyph, size, label, onClick, children, title, className, ...rest },
  ref
) {
  return (
    <IconButton
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error leafygreen confuses TS a lot here
      ref={ref}
      className={cx(buttonSizeStyle[size], className)}
      aria-label={label}
      title={title}
      onClick={onClick}
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
