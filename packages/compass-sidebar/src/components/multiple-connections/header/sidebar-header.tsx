import React from 'react';
import {
  Subtitle,
  spacing,
  css,
  type ItemAction,
  ItemActionControls,
  Badge,
  BadgeVariant,
} from '@mongodb-js/compass-components';

const sidebarHeaderStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const sidebarHeaderTextStyles = css({
  lineHeight: '32px',
  fontWeight: 600,
});

const badgeStyles = css({
  verticalAlign: 'middle',
  marginLeft: spacing[100],
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
  isCompassWeb,
}: {
  onAction(actionName: Action): void;
  isCompassWeb?: boolean;
}): React.ReactElement {
  return (
    <div className={sidebarHeaderStyles} data-testid="sidebar-header">
      <Subtitle className={sidebarHeaderTextStyles}>
        {isCompassWeb ? 'Data Explorer' : 'Compass'}
        {isCompassWeb && (
          <Badge
            variant={BadgeVariant.Blue}
            className={badgeStyles}
            data-testid="sidebar-header-badge"
          >
            Preview
          </Badge>
        )}
      </Subtitle>
      {!isCompassWeb && (
        <ItemActionControls<Action>
          onAction={onAction}
          iconSize="small"
          actions={actions}
          data-testid="connections-sidebar-title-actions"
        ></ItemActionControls>
      )}
    </div>
  );
}
