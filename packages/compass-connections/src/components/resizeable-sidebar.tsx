import React, { useCallback, useState } from 'react';
import {
  ResizeHandle,
  ResizeDirection,
  uiColors,
  css,
} from '@mongodb-js/compass-components';

const listContainerStyles = css({
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
      className={listContainerStyles}
      style={{
        minWidth: minWidth,
        width: width,
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
