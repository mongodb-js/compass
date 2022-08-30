/* eslint-disable react/prop-types */
import React, { forwardRef } from 'react';
import { Icon, IconButton } from '../index';

import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';

export const ItemActionButtonSize = {
  Small: 'small',
  Default: 'default',
} as const;

export type ItemActionButtonSize =
  typeof ItemActionButtonSize[keyof typeof ItemActionButtonSize];

const iconContainer = css({
  display: 'block',
  flex: 'none',
  fontSize: 0,
  lineHeight: 0,
});

const icons = {
  // the expand/collapse CaretRight and add database icons both use normal so
  // they don't follow the surrounding text colour
  normal: css({
    color: 'var(--icon-color)',
  }),
  // item-action-controls usually use hovered, except for the add database one
  // which is normal. This allows them to not override the standard leafygreen
  // colour
  hovered: css({}),
  // collection, database and nav item icons use inherit so they use the same
  // colour as the surrounding test. The sidebar title also uses inherit, then
  // sets a colour on the button.
  inherit: css({
    color: 'inherit',
  }),
} as const;

export type IconMode = keyof typeof icons;

// Using important here because leafygreen / emotion applies styles in the order
// that doesn't allow our styles override theirs
const iconButtonSmall = css({
  flex: 'none',
  width: `${spacing[4]}px !important`,
  height: `${spacing[4]}px !important`,
});

export const ItemActionButton = forwardRef<
  HTMLButtonElement,
  {
    glyph: string;
    mode: IconMode;
    label: string;
    title?: string;
    size: ItemActionButtonSize;
    onClick(evt: React.MouseEvent<HTMLButtonElement>): void;
  } & Omit<React.HTMLProps<HTMLButtonElement>, 'size'>
>(function IconButtonSmall(
  { glyph, size, mode, label, onClick, children, title, className, ...rest },
  ref
) {
  return (
    <IconButton
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error leafygreen confuses TS a lot here
      ref={ref}
      className={cx(
        size === ItemActionButtonSize.Small ? iconButtonSmall : '',
        className
      )}
      aria-label={label}
      title={title}
      onClick={onClick}
      {...rest}
    >
      <span role="presentation" className={cx(iconContainer, className)}>
        <Icon size={size} glyph={glyph} className={icons[mode]}></Icon>
      </span>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
});
