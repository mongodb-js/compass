import React from 'react';
import { WorkspaceTab, useTranslation } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Welcome' as const;

type PluginTitleComponentProps = PluginHeaderProps<typeof WorkspaceName>;

export function PluginTabTitleComponent(props: PluginTitleComponentProps) {
  const t = useTranslation();
  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      title={t('welcome.tab.title', 'Welcome')}
      iconGlyph="Logo"
    />
  );
}
