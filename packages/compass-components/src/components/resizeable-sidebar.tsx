import React, { useCallback, useState } from 'react';
import {
  ResizeHandle,
  ResizeDirection,
  useTheme,
  Theme,
  css,
  cx,
} from '../index';

import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

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

  '--title-color': uiColors.gray.dark3,
  '--title-bg-color': '#71F6BA', // TODO: there is no uiColors.green.light1,

  '--icon-color': 'white',

  '--item-color': 'white',
  '--item-color-active': '#71F6BA', // TODO: there is no uiColors.green.light1
  '--item-bg-color': uiColors.gray.dark3,
  '--item-bg-color-active': uiColors.black,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

const containerStylesLight = css({
  '--color': uiColors.gray.dark3,
  '--bg-color': uiColors.gray.light3,

  '--title-color': 'white',
  '--title-bg-color': uiColors.green.dark2,

  '--icon-color': uiColors.gray.dark3,

  '--item-color': uiColors.gray.dark3,
  '--item-color-active': uiColors.green.dark2,
  '--item-bg-color': uiColors.gray.light3,
  '--item-bg-color-active': uiColors.green.light3,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

const initialSidebarWidth = spacing[6] * 4 - spacing[1]; // 252px
const minSidebarWidth = spacing[4] * 9; // 216px

const ResizableSidebar = ({
  initialWidth = initialSidebarWidth,
  minWidth = minSidebarWidth,
  children,
}: {
  initialWidth?: number;
  minWidth?: number;
  children: JSX.Element;
}): JSX.Element => {
  const [width, setWidth] = useState(initialWidth);

  const getMaxSidebarWidth = useCallback(() => {
    return Math.max(minWidth, window.innerWidth - 100);
  }, [minWidth]);

  const { theme } = useTheme();

  return (
    <div
      className={cx(
        containerStyles,
        theme === Theme.Dark ? containerStylesDark : containerStylesLight
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
