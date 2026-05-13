import React from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { WorkspacePluginProps } from '@mongodb-js/workspace-info';
import { useTranslation } from 'react-i18next';

export const WorkspaceName = 'Welcome' as const;

type PluginTitleComponentProps = WorkspaceTabCoreProps &
  WorkspacePluginProps<typeof WorkspaceName>;

export function PluginTabTitleComponent(props: PluginTitleComponentProps) {
  const { t } = useTranslation('compassWelcome');
  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      title={t('workspaceName')}
      iconGlyph="Logo"
    />
  );
}
