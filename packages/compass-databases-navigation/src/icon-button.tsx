/* eslint-disable react/prop-types */
import React, { forwardRef } from 'react';
import {
  Icon,
  IconButton,
  spacing,
  css,
  cx,
  uiColors,
} from '@mongodb-js/compass-components';

const iconContainer = css({
  color: uiColors.white,
  display: 'block',
  flex: 'none',
  fontSize: 0,
});

export const SmallIcon: React.FunctionComponent<
  { glyph: string } & React.HTMLProps<HTMLSpanElement>
> = ({ glyph, className, ...props }) => {
  return (
    <span className={cx(iconContainer, className)} {...props}>
      <Icon size="small" glyph={glyph}></Icon>
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
  color: 'currentColor !important',
});

export const IconButtonSmall = forwardRef<
  HTMLButtonElement,
  {
    glyph: string;
    label: string;
    title?: string;
    onClick(evt: React.MouseEvent<HTMLButtonElement>): void;
    isActive: boolean;
  } & React.HTMLProps<HTMLButtonElement>
>(function IconButtonSmall(
  { glyph, label, onClick, isActive, children, title, className, ...rest },
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
        className
      )}
      aria-label={label}
      title={title}
      onClick={onClick}
      darkMode
      {...rest}
    >
      <SmallIcon role="presentation" glyph={glyph}></SmallIcon>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
});
