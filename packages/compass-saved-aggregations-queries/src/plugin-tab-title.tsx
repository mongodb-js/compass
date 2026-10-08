import React from 'react';
import { WorkspaceTab, useTranslation } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'My Queries' as const;

type PluginTabTitleProps = PluginHeaderProps<typeof WorkspaceName>;

export function PluginTabTitleComponent(props: PluginTabTitleProps) {
  const t = useTranslation();
  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      title={t('savedQueries.tabTitle', 'My Queries')}
      iconGlyph="CurlyBraces"
    />
  );
}
