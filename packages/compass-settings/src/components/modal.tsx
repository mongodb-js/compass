import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import {
  FormModal,
  css,
  spacing,
  focusRing,
} from '@mongodb-js/compass-components';

import GeneralSettings from './settings/general';
import { ProxySettings } from './settings/proxy-settings';
import OIDCSettings from './settings/oidc-settings';
import GenAISettings from './settings/gen-ai-settings';
import PrivacySettings from './settings/privacy';
import ThemeSettings from './settings/theme';
import FeaturePreviewSettings, {
  useShouldShowFeaturePreviewSettings,
} from './settings/feature-preview';
import Sidebar from './sidebar';
import type { SettingsTabId } from '../stores/settings';
import { saveSettings, closeModal, selectTab } from '../stores/settings';
import type { RootState } from '../stores';
import { getUserInfo } from '../stores/atlas-login';
import { useHasAIFeatureCloudRolloutAccess } from 'compass-preferences-model/provider';

type Settings = {
  tabId: SettingsTabId;
  name: string;
  component: React.ComponentType;
};

type SettingsModalProps = {
  isAIFeatureEnabled: boolean;
  isOpen: boolean;
  isOIDCEnabled: boolean;
  isProxySupportEnabled: boolean;
  selectedTab: SettingsTabId | undefined;
  onMount?: () => void;
  onClose: () => void;
  onSave: () => void;
  onSelectTab: (tab: SettingsTabId) => void;
  hasChangedSettings: boolean;
};

const contentStyles = css({
  display: 'flex',
  height: spacing[7] * 5,
  paddingTop: spacing[2],
});

const sideNavStyles = css({
  position: 'absolute',
  width: spacing[6] * 3,
});

const settingsStyles = css(
  {
    width: '80%',
    marginLeft: spacing[6] * 3,
    padding: `0 ${spacing[2]}px 0 ${spacing[3]}px`,
  },
  focusRing
);

export const SettingsModal: React.FunctionComponent<SettingsModalProps> = ({
  isAIFeatureEnabled,
  isProxySupportEnabled,
  isOpen,
  selectedTab,
  onMount,
  onClose,
  onSave,
  onSelectTab,
  isOIDCEnabled,
  hasChangedSettings,
}) => {
  const aiFeatureHasCloudRolloutAccess = useHasAIFeatureCloudRolloutAccess();
  const onMountRef = useRef(onMount);

  useEffect(() => {
    onMountRef.current?.();
  }, []);

  const settings: Settings[] = [
    { tabId: 'general', name: 'General', component: GeneralSettings },
    { tabId: 'theme', name: 'Theme', component: ThemeSettings },
    { tabId: 'privacy', name: 'Privacy', component: PrivacySettings },
  ];

  if (
    isOIDCEnabled ||
    // because oidc options overlap with atlas login used for ai feature
    isAIFeatureEnabled
  ) {
    settings.push({
      tabId: 'oidc',
      name: 'OIDC',
      component: OIDCSettings,
    });
  }

  if (aiFeatureHasCloudRolloutAccess) {
    settings.push({
      tabId: 'ai',
      name: 'Artificial Intelligence',
      component: GenAISettings,
    });
  }

  if (isProxySupportEnabled) {
    settings.push({
      tabId: 'proxy',
      name: 'Proxy Configuration',
      component: ProxySettings,
    });
  }

  if (useShouldShowFeaturePreviewSettings()) {
    settings.push({
      tabId: 'preview',
      name: 'Feature Preview',
      component: FeaturePreviewSettings,
    });
  }

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
      minBodyHeight={spacing[6] * 2}
    >
      <div className={contentStyles}>
        <div className={sideNavStyles}>
          <Sidebar
            activeItem={selectedTab}
            onSelectItem={onSelectTab}
            items={settings.map((x) => [x.tabId, x.name])}
          />
        </div>
        <div
          className={settingsStyles}
          data-testid="settings-modal-content"
          role="tabpanel"
          tabIndex={0}
          id={`${selectedTab}-section`}
          aria-labelledby={`${selectedTab}-tab`}
        >
          {SettingComponent && <SettingComponent />}
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
      isAIFeatureEnabled: !!state.settings.settings.enableGenAIFeatures,
      isOIDCEnabled: !!state.settings.settings.enableOidc,
      isProxySupportEnabled: !!state.settings.settings.enableProxySupport,
      hasChangedSettings: state.settings.updatedFields.length > 0,
      selectedTab: state.settings.tab,
    };
  },
  {
    onMount: getUserInfo,
    onClose: closeModal,
    onSave: saveSettings,
    onSelectTab: selectTab,
  }
)(SettingsModal);
