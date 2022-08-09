/* eslint-disable react/prop-types */
import React, { forwardRef } from 'react';
import { Icon, IconButton } from '../index';

import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';

const iconContainer = css({
  display: 'block',
  flex: 'none',
  fontSize: 0,
});

const icons = {
  normal: css({
    color: 'var(--icon-color)',
  }),
  hovered: css({
    color: 'var(--hover-icon-color)',
  }),
  inherit: css({
    color: 'inherit',
  }),
} as const;

const buttons = {
  normal: css({
    color: 'var(--icon-color)',
    ':hover': {
      color: 'var(--icon-color-hover)',
    },
  }),
  hovered: css({
    color: 'var(--hover-icon-color)',
    ':hover': {
      color: 'var(--hover-icon-color-hover)',
    },
  }),
  inherit: css({}),
} as const;

export type IconMode = keyof typeof icons;

export const SmallIcon: React.FunctionComponent<
  { glyph: string; mode: IconMode } & React.HTMLProps<HTMLSpanElement>
> = ({ glyph, mode, className, ...props }) => {
  return (
    <span className={cx(iconContainer, className)} {...props}>
      <Icon size="small" glyph={glyph} className={icons[mode]}></Icon>
    </span>
  );
};

// Using important here because leafygreen / emotion applies styles in the order
// that doesn't allow our styles override theirs
const iconButtonSmall = css({
  flex: 'none',
  width: `${spacing[4]}px !important`,
  height: `${spacing[4]}px !important`,
});

const iconButtonSmallActive = css({
  color: 'var(--color) !important',
  ':hover': {
    color: 'var(--hover-icon-color-hover) !important',
  },
});

export const IconButtonSmall = forwardRef<
  HTMLButtonElement,
  {
    glyph: string;
    mode: IconMode;
    label: string;
    title?: string;
    onClick(evt: React.MouseEvent<HTMLButtonElement>): void;
    isActive: boolean;
  } & React.HTMLProps<HTMLButtonElement>
>(function IconButtonSmall(
  {
    glyph,
    mode,
    label,
    onClick,
    isActive,
    children,
    title,
    className,
    ...rest
  },
  ref
) {
  return (
    <IconButton
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error leafygreen confuses TS a lot here
      ref={ref}
      className={cx(
        iconButtonSmall,
        isActive && iconButtonSmallActive,
        buttons[mode],
        className
      )}
      aria-label={label}
      title={title}
      onClick={onClick}
      {...rest}
    >
      <SmallIcon role="presentation" glyph={glyph} mode="inherit"></SmallIcon>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
});
