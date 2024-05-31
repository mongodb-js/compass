import React from 'react';
import {
  Subtitle,
  spacing,
  css,
  type ItemAction,
  ItemActionControls,
} from '@mongodb-js/compass-components';

const sidebarHeaderStyles = css({
  height: spacing[1600],
  minHeight: spacing[1600],
  padding: spacing[400],
  display: 'flex',
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
    <div className={sidebarHeaderStyles}>
      <Subtitle>Compass</Subtitle>
      <ItemActionControls<Action>
        onAction={onAction}
        iconSize="small"
        actions={actions}
        data-testid="connections-sidebar-title-actions"
      ></ItemActionControls>
    </div>
  );
}
