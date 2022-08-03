/* eslint-disable react/prop-types */
import React, { forwardRef } from 'react';
import {
  Icon,
  IconButton,
  spacing,
  css,
  cx,
} from '@mongodb-js/compass-components';
import {
  darkIconColor,
  darkIconColorHover,
  lightIconColor,
  lightIconColorHover,
} from './constants';

const iconContainer = css({
  display: 'block',
  flex: 'none',
  fontSize: 0,
});

export type IconMode = 'normal' | 'hovered';

function pickColor(darkMode: boolean, mode: IconMode) {
  if (darkMode) {
    if (mode === 'hovered') {
      return darkIconColorHover;
    }
    return darkIconColor;
  } else {
    if (mode === 'hovered') {
      return lightIconColorHover;
    }
    return lightIconColor;
  }
}

export const SmallIcon: React.FunctionComponent<
  { glyph: string; mode: IconMode } & React.HTMLProps<HTMLSpanElement>
> = ({ glyph, mode, className, ...props }) => {
  const useNewSidebar = process?.env?.COMPASS_SHOW_NEW_SIDEBAR === 'true';
  const darkMode = !useNewSidebar; // for now assume the old sidebar is dark and the new one light
  const fill = pickColor(darkMode, mode);

  return (
    <span className={cx(iconContainer, className)} {...props}>
      <Icon size="small" glyph={glyph} fill={fill}></Icon>
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
  const useNewSidebar = process?.env?.COMPASS_SHOW_NEW_SIDEBAR === 'true';
  const darkMode = !useNewSidebar; // for now assume the old sidebar is dark and the new one light
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
      darkMode={darkMode}
      {...rest}
    >
      <SmallIcon role="presentation" glyph={glyph} mode={mode}></SmallIcon>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
});
