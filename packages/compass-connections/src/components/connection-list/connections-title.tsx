import React from 'react';

import {
  ItemActionControls,
  Subtitle,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { ItemAction } from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--title-bg-color)',

  height: spacing[6],
  padding: spacing[3] + spacing[1],
});

const connectionsTitleStyles = css({
  color: 'var(--title-color)',
});

const iconStyles = css({
  color: 'var(--title-color)',
  '&:hover': {
    color: 'var(--title-color-hover)',
  },
});

type Action = 'open-compass-settings';

const actions: ItemAction<Action>[] = [
  {
    action: 'open-compass-settings',
    label: 'Compass Settings',
    icon: 'Settings',
  },
];

export default function ConnectionsTitle({
  onAction,
}: {
  onAction(actionName: Action, ...rest: any[]): void;
}) {
  return (
    <div className={containerStyles} data-testid="connections-title">
      <Subtitle className={connectionsTitleStyles}>Compass</Subtitle>
      <ItemActionControls<Action>
        onAction={onAction}
        iconSize="small"
        actions={actions}
        data-testid="connections-sidebar-title-actions"
        iconClassName={iconStyles}
      ></ItemActionControls>
    </div>
  );
}
