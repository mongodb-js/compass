import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import type { WorkspacePlugin } from '@mongodb-js/workspace-info';
import {
  WelcomeModal as WelcomeModalComponent,
  DesktopWelcomeTab,
  WebWelcomeTab,
} from './components';
import { PluginTabTitleComponent, WorkspaceName } from './plugin-tab-title';
import {
  preferencesLocator,
  usePreference,
} from 'compass-preferences-model/provider';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import welcomeModalStore from './stores/welcome-modal-store';

// Provides the i18n instance via context and keeps it in sync with the
// language preference. Using I18nextProvider (rather than passing { i18n }
// directly to useTranslation) is what makes react-i18next's event subscription
// work so components re-render immediately when changeLanguage resolves.
function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const language = usePreference('language');
  React.useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);
  return React.createElement(I18nextProvider, { i18n }, children);
}

const WorkspaceTabProvider = registerCompassPlugin(
  {
    name: WorkspaceName,
    component: ({ children }) => {
      return React.createElement(I18nProvider, null, children);
    },
    // Set language before the first render so the initial paint is correct.
    activate(_initialProps, services) {
      const { language } = services.preferences.getPreferences();
      void i18n.changeLanguage(language);
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
    I18nextProvider,
    { i18n },
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
      void i18n.changeLanguage(language);
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
