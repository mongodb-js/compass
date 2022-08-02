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
  background: uiColors.gray.dark3,
  color: 'white',
});

const containerStylesLight = css({

  background: uiColors.gray.light3,
  color: uiColors.gray.dark3,
});

const ResizableSidebar = ({
  initialWidth,
  minWidth,
  children,
  darkMode
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
      className={cx(containerStyles, darkMode ? containerStylesDark : containerStylesLight )}
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
