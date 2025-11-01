import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import type { WorkspacePlugin } from '@mongodb-js/compass-workspaces';
import {
  WelcomeModal as WelcomeModalComponent,
  DesktopWelcomeTab,
  WebWelcomeTab,
} from './components';
import { PluginTabTitleComponent, WorkspaceName } from './plugin-tab-title';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import welcomeModalStore from './stores/welcome-modal-store';

// These plugins don't have any state or logic of their own, so their provider
// is just an "empty" plugin
const WorkspaceTabProvider = registerCompassPlugin({
  name: WorkspaceName,
  component: ({ children }) => {
    return React.createElement(React.Fragment, null, children);
  },
  activate() {
    return { store: {}, deactivate: () => undefined };
  },
});

export const DesktopWorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: WorkspaceTabProvider,
  content: DesktopWelcomeTab,
  header: PluginTabTitleComponent,
};

export const WebWorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: WorkspaceTabProvider,
  content: WebWelcomeTab,
  header: PluginTabTitleComponent,
};

export const WelcomeModal = registerCompassPlugin(
  {
    name: 'WelcomeModal',
    component: WelcomeModalComponent,
    activate(_initialProps, services, { cleanup }) {
      const { showedNetworkOptIn } = services.preferences.getPreferences();
      const store = createStore(
        welcomeModalStore,
        { isOpen: !showedNetworkOptIn },
        applyMiddleware(thunk.withExtraArgument(services))
      );
      return { store, deactivate: cleanup };
    },
  },
  { preferences: preferencesLocator }
);
