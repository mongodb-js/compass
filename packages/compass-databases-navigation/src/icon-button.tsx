/* eslint-disable react/prop-types */
import React, { forwardRef } from 'react';
import {
  Icon,
  IconButton,
  spacing,
  css,
  cx,
  useTheme,
  Theme,
} from '@mongodb-js/compass-components';

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
} as const;

type IconMode = keyof typeof icons;

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
  const { theme } = useTheme();
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
      // TODO: we should probably explicitly set our own colors given that we're
      // setting all the colours around it. Rather than rely on leafygreen's
      // default dark or light hover background colour.
      darkMode={theme === Theme.Dark}
      {...rest}
    >
      <SmallIcon role="presentation" glyph={glyph} mode="hovered"></SmallIcon>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
});
