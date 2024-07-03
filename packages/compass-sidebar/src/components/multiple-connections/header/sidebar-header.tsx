import React from 'react';
import {
  Subtitle,
  spacing,
  css,
  type ItemAction,
  ItemActionControls,
} from '@mongodb-js/compass-components';

const sidebarHeaderStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  display: 'flex',
  justifyContent: 'space-between',
});

const sidebarHeaderTextStyles = css({
  lineHeight: '32px',
  fontWeight: 600,
});

type Action = 'open-compass-settings';

const actions: ItemAction<Action>[] = [
  {
    action: 'open-compass-settings',
    label: 'Compass Settings',
    icon: 'Settings',
  },
];

export function SidebarHeader({
  onAction,
}: {
  onAction(actionName: Action): void;
}): React.ReactElement {
  return (
    <div className={sidebarHeaderStyles} data-testid="sidebar-header">
      <Subtitle className={sidebarHeaderTextStyles}>Compass</Subtitle>
      <ItemActionControls<Action>
        onAction={onAction}
        iconSize="small"
        actions={actions}
        data-testid="connections-sidebar-title-actions"
      ></ItemActionControls>
    </div>
  );
}
