import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import type { WorkspacePlugin } from '@mongodb-js/workspace-info';
import {
  WelcomeModal as WelcomeModalComponent,
  DesktopWelcomeTab,
  WebWelcomeTab,
} from './components';
import { PluginTabTitleComponent, WorkspaceName } from './plugin-tab-title';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { I18nProvider, initLanguage } from './i18n';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import welcomeModalStore from './stores/welcome-modal-store';

const WorkspaceTabProvider = registerCompassPlugin(
  {
    name: WorkspaceName,
    component: ({ children }) =>
      React.createElement(I18nProvider, null, children),
    activate(_initialProps, services) {
      initLanguage(services.preferences.getPreferences().language);
      return { store: {}, deactivate: () => undefined };
    },
  },
  { preferences: preferencesLocator }
);

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

function WelcomeModalWithI18n(
  props: React.ComponentProps<typeof WelcomeModalComponent>
): React.ReactElement {
  return React.createElement(
    I18nProvider,
    null,
    React.createElement(WelcomeModalComponent, props)
  );
}

export const WelcomeModal = registerCompassPlugin(
  {
    name: 'WelcomeModal',
    component: WelcomeModalWithI18n,
    activate(_initialProps, services, { cleanup }) {
      const { showedNetworkOptIn, language } =
        services.preferences.getPreferences();
      initLanguage(language);
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
