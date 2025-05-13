import React from 'react';
import {
  Button,
  css,
  spacing,
  Subtitle,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import MCPToolbar from './toolbar';

const contentStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

export function MCPContent() {
  return (
    <WorkspaceContainer toolbar={<MCPToolbar />}>
      <div className={contentStyles}>
        <Subtitle>Welcome!</Subtitle>
        <Button
          onClick={() => {
            //
          }}
        >
          Setup client
        </Button>
      </div>
    </WorkspaceContainer>
  );
}
