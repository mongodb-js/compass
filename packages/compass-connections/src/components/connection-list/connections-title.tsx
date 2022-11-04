import React from 'react';

import { css, spacing, Subtitle } from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--title-bg-color)',

  height: spacing[6],
  padding: spacing[3] + spacing[1],
});

const connectionsTitleStyles = css({
  color: 'var(--title-color)',
  fontFamily: 'MongoDB Value Serif',
  fontWeight: 'normal',
});

export default function ConnectionsTitle() {
  return (
    <div className={containerStyles} data-testid="connections-title">
      <Subtitle className={connectionsTitleStyles}>Compass</Subtitle>
    </div>
  );
}
