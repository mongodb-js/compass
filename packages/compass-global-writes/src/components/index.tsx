import {
  css,
  spacing,
  WorkspaceContainer,
  Body,
} from '@mongodb-js/compass-components';
import React from 'react';

const containerStyles = css({
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  display: 'flex',
  width: '100%',
  height: '100%',
});

const centeredContent = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

export function GlobalWrites() {
  return (
    <div className={containerStyles}>
      <WorkspaceContainer>
        <Body className={centeredContent}>
          This feature is currently in development.
        </Body>
      </WorkspaceContainer>
    </div>
  );
}
