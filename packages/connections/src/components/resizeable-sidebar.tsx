/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { ResizeHandle, ResizeDirection } from '@mongodb-js/compass-components';
import { useState } from 'react';
import { ConnectionInfo } from 'mongodb-data-service';

import ConnectionList from './connection-list/connection-list';

const initialSidebarWidth = 250;
const minSidebarWidth = 150;

const slateBlueColor = '#001E2B';

const listContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  maxWidth: '80%',
  minWidth: minSidebarWidth,
  height: '100%',
  position: 'relative',
  background: slateBlueColor,
  color: 'white',
});

function getMaxSidebarWidth() {
  return Math.max(minSidebarWidth, window.innerWidth - 100);
}

function ResizableSidebar({
  activeConnectionId,
  connections,
  setActiveConnectionId,
}: {
  activeConnectionId?: string;
  connections: ConnectionInfo[];
  setActiveConnectionId: (newConnectionId?: string) => void;
}): React.ReactElement {
  const [width, setWidth] = useState(initialSidebarWidth);

  return (
    <div
      css={listContainerStyles}
      style={{
        width: width,
      }}
    >
      <ResizeHandle
        onChange={(newWidth) => setWidth(newWidth)}
        direction={ResizeDirection.RIGHT}
        value={width}
        minValue={minSidebarWidth}
        maxValue={getMaxSidebarWidth()}
        title="sidebar"
      />
      <ConnectionList
        activeConnectionId={activeConnectionId}
        connections={connections}
        setActiveConnectionId={setActiveConnectionId}
      />
    </div>
  );
}

export default ResizableSidebar;
