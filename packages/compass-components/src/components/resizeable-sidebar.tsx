import React, { useCallback, useState } from 'react';

import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { useDarkMode } from '../hooks/use-theme';
import { ResizeDirection, ResizeHandle } from './resize-handle';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  height: '100%',
  position: 'relative',
});

const containerStylesDark = css({
  '--color': palette.white,
  '--bg-color': palette.gray.dark4,

  '--title-color': palette.gray.dark3,
  '--title-color-hover': palette.white,
  '--title-bg-color': palette.green.light1,

  '--icon-color': palette.white,

  '--item-color': palette.white,
  '--item-color-active': palette.green.base,
  '--item-bg-color': palette.gray.dark4,
  '--item-bg-color-hover': palette.gray.dark2,
  '--item-bg-color-active': palette.black,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

const containerStylesLight = css({
  '--color': palette.gray.dark3,
  '--bg-color': palette.gray.light3,

  '--title-color': palette.white,
  '--title-color-hover': palette.gray.dark3,
  '--title-bg-color': palette.green.dark2,

  '--icon-color': palette.gray.dark3,

  '--item-color': palette.gray.dark3,
  '--item-color-active': palette.green.dark2,
  '--item-bg-color': palette.gray.light3,
  '--item-bg-color-hover': palette.gray.light2,
  '--item-bg-color-active': palette.green.light3,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

export const defaultSidebarWidth = 300;

const ResizableSidebar = ({
  initialWidth = defaultSidebarWidth,
  minWidth = 210,
  children,
  className,
  style,
  useNewTheme,
  ...props
}: {
  initialWidth?: number;
  minWidth?: number;
  children: JSX.Element;
  useNewTheme?: boolean;
} & React.HTMLProps<HTMLDivElement>): JSX.Element => {
  const darkMode = useDarkMode();
  const [width, setWidth] = useState(initialWidth);
  const newThemeStyles = useNewTheme
    ? {
        '--item-color-active': darkMode ? palette.white : palette.gray.dark3,
        '--item-bg-color-active': darkMode
          ? palette.gray.dark2
          : palette.gray.light2,
      }
    : {};

  const getMaxSidebarWidth = useCallback(() => {
    return Math.max(minWidth, 600);
  }, [minWidth]);

  // Apply bounds to the sidebar width when resizing to ensure it's always
  // visible and usable to the user.
  const boundSidebarWidth = useCallback(
    (attemptedWidth: number) => {
      const maxWidth = getMaxSidebarWidth();

      return Math.min(maxWidth, Math.max(minWidth, attemptedWidth));
    },
    [getMaxSidebarWidth, minWidth]
  );

  const renderedWidth = boundSidebarWidth(width);

  return (
    <div
      className={cx(
        containerStyles,
        darkMode ? containerStylesDark : containerStylesLight,
        className
      )}
      style={{
        ...style,
        minWidth,
        width: renderedWidth,
        flex: 'none',
        ...newThemeStyles,
      }}
      {...props}
    >
      {children}
      <ResizeHandle
        onChange={setWidth}
        direction={ResizeDirection.RIGHT}
        value={width}
        minValue={minWidth}
        maxValue={getMaxSidebarWidth()}
        title="sidebar"
      />
    </div>
  );
};

export default ResizableSidebar;
