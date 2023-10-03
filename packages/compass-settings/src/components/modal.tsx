import React, { useEffect, useRef, useState } from 'react';
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
import { saveSettings, closeModal } from '../stores/settings';
import type { RootState } from '../stores';
import { getUserInfo } from '../stores/atlas-login';
import { useIsAIFeatureEnabled } from 'compass-preferences-model';

type Settings = {
  name: string;
  component: React.ComponentType;
};

type SettingsModalProps = {
  isOpen: boolean;
  isOIDCEnabled: boolean;
  onMount?: () => void;
  onClose: () => void;
  onSave: () => void;
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
  onMount,
  onClose,
  onSave,
  isOIDCEnabled,
  hasChangedSettings,
}) => {
  const aiFeatureEnabled = useIsAIFeatureEnabled(React);
  const onMountRef = useRef(onMount);

  useEffect(() => {
    onMountRef.current?.();
  }, []);

  const settings: Settings[] = [
    { name: 'General', component: GeneralSettings },
    { name: 'Theme', component: ThemeSettings },
    { name: 'Privacy', component: PrivacySettings },
  ];

  if (
    isOIDCEnabled ||
    // because oidc options overlap with atlas login used for ai feature
    aiFeatureEnabled
  ) {
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

  const SettingComponent =
    settings.find((x) => x.name === selectedSetting)?.component ?? null;

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
      isOpen:
        state.settings.isModalOpen && state.settings.loadingState === 'ready',
      isOIDCEnabled: !!state.settings.settings.enableOidc,
      hasChangedSettings: state.settings.updatedFields.length > 0,
    };
  },
  {
    onMount: getUserInfo,
    onClose: closeModal,
    onSave: saveSettings,
  }
)(SettingsModal);
