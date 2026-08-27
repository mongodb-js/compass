import React, { useEffect, useRef, useMemo } from 'react';
import { connect } from 'react-redux';
import type { UserConfigurablePreferences } from 'compass-preferences-model';

import {
  FormModal,
  css,
  spacing,
  focusRing,
} from '@mongodb-js/compass-components';

import GeneralSettings, { generalFields } from './settings/general';
import { ProxySettings, proxyFields } from './settings/proxy-settings';
import OIDCSettings, { oidcFields } from './settings/oidc-settings';
import GenAISettings, { genaiFields } from './settings/gen-ai-settings';
import PrivacySettings, { privacyFields } from './settings/privacy';
import ThemeSettings, { themeFields } from './settings/theme';
import FeaturePreviewSettings, {
  useShouldShowFeaturePreviewSettings,
} from './settings/feature-preview';
import Sidebar from './sidebar';
import type { SettingsTabId } from '../stores/settings';
import { saveSettings, closeModal, selectTab } from '../stores/settings';
import type { RootState } from '../stores';

type Settings = {
  tabId: SettingsTabId;
  name: string;
  component: React.ComponentType;
  preferences: readonly (keyof UserConfigurablePreferences)[];
};

type SettingsModalProps = {
  isOpen: boolean;
  selectedTab: SettingsTabId | undefined;
  onMount?: () => void;
  onClose: () => void;
  onSave: () => void;
  onSelectTab: (tab: SettingsTabId) => void;
  hasChangedSettings: boolean;
  userConfigurableSettings: Partial<{
    [key in keyof UserConfigurablePreferences]: unknown;
  }>;
};

const containerStyles = css({
  display: 'flex',
  height: spacing[7] * 5,
  paddingTop: spacing[200],
});

const sideNavStyles = css({
  position: 'absolute',
  width: spacing[1600] * 3,
});

const tabContentStyles = css(
  {
    width: '80%',
    marginLeft: spacing[1600] * 3,
  },
  focusRing
);

const contentStyles = css({
  paddingRight: spacing[200],
  paddingLeft: spacing[400],
  paddingBottom: spacing[200],
});

export const SettingsModal: React.FunctionComponent<SettingsModalProps> = ({
  isOpen,
  selectedTab,
  onMount,
  onClose,
  onSave,
  onSelectTab,
  hasChangedSettings,
  userConfigurableSettings,
}) => {
  const onMountRef = useRef(onMount);

  useEffect(() => {
    onMountRef.current?.();
  }, []);

  const hasFeaturePreviewSettings = useShouldShowFeaturePreviewSettings();
  const settings: Settings[] = useMemo(() => {
    const settings: Settings[] = [
      {
        tabId: 'general' as SettingsTabId,
        preferences: generalFields,
        name: 'General',
        component: GeneralSettings,
      },
      {
        tabId: 'theme' as SettingsTabId,
        preferences: themeFields,
        name: 'Theme',
        component: ThemeSettings,
      },
      {
        tabId: 'privacy' as SettingsTabId,
        preferences: privacyFields,
        name: 'Privacy',
        component: PrivacySettings,
      },
      {
        tabId: 'proxy' as SettingsTabId,
        preferences: proxyFields,
        name: 'Proxy Configuration',
        component: ProxySettings,
      },
      {
        tabId: 'oidc' as SettingsTabId,
        preferences: oidcFields,
        name: 'OIDC',
        component: OIDCSettings,
      },
      {
        tabId: 'ai' as SettingsTabId,
        preferences: genaiFields,
        name: 'Artificial Intelligence',
        component: GenAISettings,
      },
    ].filter((setting) => {
      return setting.preferences.some((pref) =>
        Object.hasOwn(userConfigurableSettings, pref)
      );
    });

    if (hasFeaturePreviewSettings) {
      settings.push({
        tabId: 'preview',
        name: 'Feature Preview',
        preferences: [],
        component: FeaturePreviewSettings,
      });
    }

    return settings;
  }, [userConfigurableSettings, hasFeaturePreviewSettings]);

  selectedTab ??= settings[0].tabId;
  const SettingComponent =
    settings.find((x) => x.tabId === selectedTab)?.component ?? null;

  return (
    <FormModal
      size="large"
      title="Settings"
      open={isOpen}
      submitButtonText="Save"
      onSubmit={onSave}
      submitDisabled={!hasChangedSettings}
      onCancel={onClose}
      data-testid="settings-modal"
      minBodyHeight={spacing[1600] * 2}
    >
      <div className={containerStyles}>
        <div className={sideNavStyles}>
          <Sidebar
            activeItem={selectedTab}
            onSelectItem={onSelectTab}
            items={settings.map((x) => [x.tabId, x.name])}
          />
        </div>
        <div
          className={tabContentStyles}
          data-testid="settings-modal-content"
          role="tabpanel"
          tabIndex={0}
          id={`${selectedTab}-section`}
          aria-labelledby={`${selectedTab}-tab`}
        >
          <div className={contentStyles}>
            {SettingComponent && <SettingComponent />}
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default connect(
  (state: RootState) => {
    return {
      isOpen:
        state.settings.isModalOpen && state.settings.loadingState === 'ready',
      hasChangedSettings: state.settings.updatedFields.length > 0,
      selectedTab: state.settings.tab,
      userConfigurableSettings: state.settings.settings,
    };
  },
  {
    onClose: closeModal,
    onSave: saveSettings,
    onSelectTab: selectTab,
  }
)(SettingsModal);
