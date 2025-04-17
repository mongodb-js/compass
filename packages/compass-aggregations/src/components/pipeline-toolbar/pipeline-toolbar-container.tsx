import {
  css,
  cx,
  spacing,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import React from 'react';

const containerStyles = css({
  padding: spacing[400],
});

const containerDisplayStyles = css({
  display: 'grid',
  gap: spacing[400],
  gridTemplateAreas: `
  "headerAndOptionsRow"
  "settingsRow"
  `,
});

export const smallPipelineToolbar = () => {
  return `@container ${WorkspaceContainer.toolbarContainerQueryName} (width < 900px)`;
};

export const hiddenOnNarrowPipelineToolbarStyles = css({
  [smallPipelineToolbar()]: {
    display: 'none',
  },
});

export const PipelineToolbarContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div
    className={cx(containerStyles, containerDisplayStyles)}
    data-testid="pipeline-toolbar"
  >
    {children}
  </div>
);
