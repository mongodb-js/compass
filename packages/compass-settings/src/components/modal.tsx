import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import {
  FormModal,
  css,
  spacing,
  focusRing,
} from '@mongodb-js/compass-components';

import GeneralSettings from './settings/general';
import OIDCSettings from './settings/oidc-settings';
import PrivacySettings from './settings/privacy';
import ThemeSettings from './settings/theme';
import FeaturePreviewSettings, {
  useShouldShowFeaturePreviewSettings,
} from './settings/feature-preview';
import Sidebar from './sidebar';
import { saveSettings, fetchSettings } from '../stores/settings';
import type { RootState } from '../stores';

type Settings = {
  name: string;
  component: React.ComponentType;
};

type SettingsModalProps = {
  isOpen: boolean;
  isOIDCEnabled: boolean;
  closeModal: () => void;
  onSave: () => void;
  fetchSettings: () => Promise<void>;
  loadingState: 'loading' | 'ready';
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
  isOpen,
  closeModal,
  onSave,
  fetchSettings,
  isOIDCEnabled,
  loadingState,
  hasChangedSettings,
}) => {
  const settings: Settings[] = [
    { name: 'General', component: GeneralSettings },
    { name: 'Theme', component: ThemeSettings },
    { name: 'Privacy', component: PrivacySettings },
  ];

  if (isOIDCEnabled) {
    settings.push({
      name: 'OIDC (Preview)',
      component: OIDCSettings,
    });
  }

  if (useShouldShowFeaturePreviewSettings()) {
    settings.push({
      name: 'Feature Preview',
      component: FeaturePreviewSettings,
    });
  }

  const [selectedSetting, setSelectedSettings] = useState(settings[0].name);

  useEffect(() => {
    if (isOpen) {
      void fetchSettings();
    }
  }, [isOpen, fetchSettings]);

  const SettingComponent =
    settings.find((x) => x.name === selectedSetting)?.component ?? null;

  const saveSettings = () => {
    onSave();
    closeModal();
  };

  if (loadingState !== 'ready') {
    return null;
  }

  return (
    <FormModal
      size="large"
      title="Settings"
      open={isOpen}
      submitButtonText="Save"
      onSubmit={saveSettings}
      submitDisabled={!hasChangedSettings}
      onCancel={closeModal}
      data-testid="settings-modal"
      minBodyHeight={spacing[6] * 2}
    >
      <div className={contentStyles}>
        <div className={sideNavStyles}>
          <Sidebar
            activeItem={selectedSetting}
            onSelectItem={setSelectedSettings}
            items={settings.map((x) => x.name)}
          />
        </div>
        <div
          className={settingsStyles}
          data-testid="settings-modal-content"
          role="tabpanel"
          tabIndex={0}
          id={`${selectedSetting} Section`}
          aria-labelledby={`${selectedSetting} Tab`}
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
      loadingState: state.settings.loadingState,
      isOIDCEnabled: !!state.settings.settings.enableOidc,
      hasChangedSettings: state.settings.updatedFields.length > 0,
    };
  },
  {
    onSave: saveSettings,
    fetchSettings,
  }
)(SettingsModal);
