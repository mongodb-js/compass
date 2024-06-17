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
import GenAISettings from './settings/gen-ai-settings';
import PrivacySettings from './settings/privacy';
import ThemeSettings from './settings/theme';
import FeaturePreviewSettings, {
  useShouldShowFeaturePreviewSettings,
} from './settings/feature-preview';
import Sidebar from './sidebar';
import { saveSettings, closeModal } from '../stores/settings';
import type { RootState } from '../stores';
import { getUserInfo } from '../stores/atlas-login';
import { useHasAIFeatureCloudRolloutAccess } from 'compass-preferences-model/provider';

type Settings = {
  name: string;
  component: React.ComponentType;
};

type SettingsModalProps = {
  isAIFeatureEnabled: boolean;
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
  isAIFeatureEnabled,
  isOpen,
  onMount,
  onClose,
  onSave,
  isOIDCEnabled,
  hasChangedSettings,
}) => {
  const aiFeatureHasCloudRolloutAccess = useHasAIFeatureCloudRolloutAccess();
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
    isAIFeatureEnabled
  ) {
    settings.push({
      name: 'OIDC',
      component: OIDCSettings,
    });
  }

  if (aiFeatureHasCloudRolloutAccess) {
    settings.push({
      name: 'Artificial Intelligence',
      component: GenAISettings,
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
      isAIFeatureEnabled: !!state.settings.settings.enableGenAIFeatures,
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
