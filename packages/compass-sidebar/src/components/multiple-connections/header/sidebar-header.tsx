import React, { useMemo } from 'react';
import {
  Subtitle,
  spacing,
  css,
  type ItemAction,
  ItemActionControls,
  Badge,
  useTranslation,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';

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
  const t = useTranslation();
  const enableCompassWebSettings = usePreference('enableCompassWebSettings');
  const actions = useMemo<ItemAction<Action>[]>(
    () => [
      {
        action: 'open-compass-settings',
        label: t('sidebar.header.compassSettings', 'Compass Settings'),
        icon: 'Settings',
      },
    ],
    [t]
  );
  return (
    <div className={sidebarHeaderStyles} data-testid="sidebar-header">
      <Subtitle className={sidebarHeaderTextStyles}>
        {isCompassWeb
          ? t('sidebar.header.dataExplorer', 'Data Explorer')
          : 'Compass'}
        {SHOULD_SHOW_COMMIT_HASH && COMMIT_HASH && (
          <>
            &nbsp;<Badge variant="blue">{COMMIT_HASH}</Badge>
          </>
        )}
      </Subtitle>
      {(!isCompassWeb || enableCompassWebSettings) && (
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
