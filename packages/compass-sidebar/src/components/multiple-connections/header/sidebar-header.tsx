import React from 'react';
import { Subtitle, spacing, css } from '@mongodb-js/compass-components';

const sidebarHeaderStyles = css({
  maxHeight: spacing[6],
  height: spacing[6],
  padding: spacing[3],
});

export function SidebarHeader(): React.ReactElement {
  return (
    <div className={sidebarHeaderStyles}>
      <Subtitle>Compass</Subtitle>
    </div>
  );
}
