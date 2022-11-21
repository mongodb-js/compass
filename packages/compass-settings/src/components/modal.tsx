import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import {
  FormModal,
  css,
  spacing,
  focusRing,
} from '@mongodb-js/compass-components';

import FeaturesSettings from './settings/features';
import PrivacySettings from './settings/privacy';
import ThemeSettings from './settings/theme';
import Sidebar from './sidebar';
import { saveSettings, fetchSettings } from '../stores/settings';
import type { RootState } from '../stores';

type Settings = {
  name: string;
  component: React.ComponentType;
};

type SettingsModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  onSave: () => void;
  fetchSettings: () => Promise<void>;
  loadingState: 'loading' | 'ready';
  hasChangedSettings: boolean;
};

const contentStyles = css({
  display: 'flex',
  minHeight: '400px',
});

const sideNavStyles = css({
  width: '20%',
});

const settingsStyles = css(
  {
    width: '80%',
    paddingLeft: spacing[2],
  },
  focusRing
);

const settings: Settings[] = [
  { name: 'Privacy', component: PrivacySettings },
  { name: 'Features', component: FeaturesSettings },
  { name: 'Theme', component: ThemeSettings },
];

export const SettingsModal: React.FunctionComponent<SettingsModalProps> = ({
  isOpen,
  closeModal,
  onSave,
  fetchSettings,
  loadingState,
  hasChangedSettings,
}) => {
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
      hasChangedSettings: state.settings.updatedFields.length > 0,
    };
  },
  {
    onSave: saveSettings,
    fetchSettings,
  }
)(SettingsModal);
