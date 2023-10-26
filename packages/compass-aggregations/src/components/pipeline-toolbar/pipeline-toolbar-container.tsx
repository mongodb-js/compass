import { css, cx, spacing } from '@mongodb-js/compass-components';
import React from 'react';

const containerQueryName = 'pipeline-toolbar-container';

const containerStyles = css({
  padding: spacing[3],
  containerName: containerQueryName,
  containerType: 'inline-size',
});

const containerDisplayStyles = css({
  display: 'grid',
  gap: spacing[3],
  gridTemplateAreas: `
  "headerAndOptionsRow"
  "settingsRow"
  `,
});

export const hiddenOnNarrowPipelineToolbarStyles = css({
  [`@container ${containerQueryName} (width < 900px)`]: {
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
