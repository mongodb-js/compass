import React from 'react';
import {
  css,
  spacing,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import MCPToolbar from './toolbar';
import MCPChat from './chat';

const contentStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 50px)', // Height minus toolbar
});

export function MCPContent() {
  return (
    <WorkspaceContainer toolbar={<MCPToolbar />}>
      <div className={contentStyles}>
        <MCPChat />
      </div>
    </WorkspaceContainer>
  );
}
