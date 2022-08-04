import React, { useCallback, useState } from 'react';
import { ResizeHandle, ResizeDirection, css, cx } from '../index';

import { uiColors } from '@leafygreen-ui/palette';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  maxWidth: '80%',
  height: '100%',
  position: 'relative',
});

const containerStylesDark = css({
  '--color': 'white',
  '--bg-color': uiColors.gray.dark3,

  '--icon-color': 'white',
  // NOTE: This is for icons that only display when hovering over an item,
  // not the color used for the icon when hovering over the icon itself.
  '--hover-icon-color': 'white',

  '--item-color': 'white',
  '--item-color-hover': 'white',
  '--item-color-active': 'white',
  '--item-bg-color': uiColors.gray.dark2,
  '--item-bg-color-hover': uiColors.gray.dark3,
  '--item-bg-color-active': uiColors.gray.dark1,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

const containerStylesLight = css({
  '--color': uiColors.gray.dark3,
  '--bg-color': uiColors.gray.light3,

  '--icon-color': uiColors.gray.dark3,
  '--hover-icon-color': uiColors.gray.dark1,

  '--item-color': uiColors.gray.dark3,
  '--item-color-hover': uiColors.gray.dark3,
  '--item-color-active': uiColors.green.dark2,
  '--item-bg-color': uiColors.gray.light3,
  '--item-bg-color-hover': uiColors.green.light2,
  '--item-bg-color-active': uiColors.green.light3,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

const ResizableSidebar = ({
  initialWidth,
  minWidth,
  children,
  darkMode,
}: {
  initialWidth: number;
  minWidth: number;
  children: JSX.Element;
  darkMode: boolean;
}): JSX.Element => {
  const [width, setWidth] = useState(initialWidth);

  const getMaxSidebarWidth = useCallback(() => {
    return Math.max(minWidth, window.innerWidth - 100);
  }, [minWidth]);

  return (
    <div
      className={cx(
        containerStyles,
        darkMode ? containerStylesDark : containerStylesLight
      )}
      style={{
        minWidth: minWidth,
        width: width,
        flex: 'none',
      }}
    >
      {children}
      <ResizeHandle
        onChange={(newWidth) => setWidth(newWidth)}
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
