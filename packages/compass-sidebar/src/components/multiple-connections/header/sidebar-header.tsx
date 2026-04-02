import React from 'react';
import {
  Subtitle,
  spacing,
  css,
  type ItemAction,
  ItemActionControls,
  Badge,
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

type Action = 'open-compass-settings';

const actions: ItemAction<Action>[] = [
  {
    action: 'open-compass-settings',
    label: 'Compass Settings',
    icon: 'Settings',
  },
];

const SHOULD_SHOW_COMMIT_HASH =
  process.env.APP_ENV === 'webdriverio' ||
  process.env.NODE_ENV === 'development';
const COMMIT_HASH = process.env.GIT_COMMIT_HASH;

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
        {SHOULD_SHOW_COMMIT_HASH && COMMIT_HASH && (
          <>
            &nbsp;<Badge variant="blue">{COMMIT_HASH}</Badge>
          </>
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
