import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import type { WorkspacePlugin } from '@mongodb-js/workspace-info';
import { PluginTabTitleComponent, WorkspaceName } from './plugin-tab-title';
import { AssistantTab } from './components/assistant-tab';

// The Assistant tab relies on the global CompassAssistantProvider mounted
// by the host app for chat state and services, so the per-tab provider is
// just an empty plugin.
const AssistantWorkspaceTabProvider = registerCompassPlugin({
  name: WorkspaceName,
  component: ({ children }) => {
    return React.createElement(React.Fragment, null, children);
  },
  activate() {
    return { store: {}, deactivate: () => undefined };
  },
});

export const AssistantWorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: AssistantWorkspaceTabProvider,
  content: AssistantTab,
  header: PluginTabTitleComponent,
};
