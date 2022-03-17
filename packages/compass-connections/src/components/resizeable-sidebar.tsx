import React, { useCallback, useState } from 'react';
import {
  ResizeHandle,
  ResizeDirection,
  uiColors,
  css,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  maxWidth: '80%',
  height: '100%',
  position: 'relative',
  background: uiColors.gray.dark3,
  color: 'white',
});

const ResizableSidebar = ({
  initialWidth,
  minWidth,
  children,
}: {
  initialWidth: number;
  minWidth: number;
  children: JSX.Element;
}): JSX.Element => {
  const [width, setWidth] = useState(initialWidth);

  const getMaxSidebarWidth = useCallback(() => {
    return Math.max(minWidth, window.innerWidth - 100);
  }, [minWidth]);

  return (
    <div
      className={containerStyles}
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
