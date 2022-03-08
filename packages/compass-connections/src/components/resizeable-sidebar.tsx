import React, { useState } from 'react';
import {
  ResizeHandle,
  ResizeDirection,
  uiColors,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from 'mongodb-data-service';

import ConnectionList from './connection-list/connection-list';

const initialSidebarWidth = spacing[4] * 10 + spacing[2]; // 248px
const minSidebarWidth = spacing[4] * 7; // 168px

const listContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  maxWidth: '80%',
  minWidth: minSidebarWidth,
  height: '100%',
  position: 'relative',
  background: uiColors.gray.dark3,
  color: 'white',
});

function getMaxSidebarWidth() {
  return Math.max(minSidebarWidth, window.innerWidth - 100);
}

function ResizableSidebar({
  activeConnectionId,
  connections,
  createNewConnection,
  setActiveConnectionId,
  onConnectionDoubleClicked,
  removeAllRecentsConnections,
  duplicateConnection,
  removeConnection,
}: {
  activeConnectionId?: string;
  connections: ConnectionInfo[];
  createNewConnection: () => void;
  setActiveConnectionId: (newConnectionId: string) => void;
  onConnectionDoubleClicked: (connectionInfo: ConnectionInfo) => void;
  removeAllRecentsConnections: () => void;
  duplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
}): React.ReactElement {
  const [width, setWidth] = useState(initialSidebarWidth);

  return (
    <div
      className={listContainerStyles}
      style={{
        minWidth: width,
        width: width,
      }}
    >
      <ConnectionList
        activeConnectionId={activeConnectionId}
        connections={connections}
        createNewConnection={createNewConnection}
        setActiveConnectionId={setActiveConnectionId}
        onDoubleClick={onConnectionDoubleClicked}
        removeAllRecentsConnections={removeAllRecentsConnections}
        removeConnection={removeConnection}
        duplicateConnection={duplicateConnection}
      />
      <ResizeHandle
        onChange={(newWidth) => setWidth(newWidth)}
        direction={ResizeDirection.RIGHT}
        value={width}
        minValue={minSidebarWidth}
        maxValue={getMaxSidebarWidth()}
        title="sidebar"
      />
    </div>
  );
}

export default ResizableSidebar;
