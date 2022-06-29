import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ipc from 'hadron-ipc';

import {
  Modal,
  ModalTitle,
  ModalFooter,
  H3,
  css,
  spacing,
  Button,
} from '@mongodb-js/compass-components';

import { fetchSettings } from '../stores/settings';

import PrivacySettings from './settings/privacy';
import Sidebar from './sidebar';

type Settings = {
  name: string;
  component: React.ComponentType;
};

type SettingsModalProps = {
  onInit: () => void;
};

const contentStyles = css({
  display: 'flex',
  minHeight: '400px',
});

const sideNavStyles = css({
  width: '20%',
});

const settingsStyles = css({
  width: '80%',
  padding: spacing[2],
});

const settings: Settings[] = [{ name: 'Privacy', component: PrivacySettings }];

export const SettingsModal: React.FunctionComponent<SettingsModalProps> = ({
  onInit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSetting, setSelectedSettings] = useState(settings[0].name);

  const SettingComponent =
    settings.find((x) => x.name === selectedSetting)?.component ?? null;

  useEffect(() => {
    if (isOpen) {
      onInit();
    }
  }, [onInit, isOpen]);

  useEffect(() => {
    (ipc as any).on('window:show-network-optin', () => {
      setIsOpen(!isOpen);
    });
  }, [setIsOpen, isOpen]);

  return (
    <Modal
      size="large"
      open={isOpen}
      setOpen={() => setIsOpen(false)}
      data-testid="settings-modal"
    >
      <ModalTitle as={H3}>Settings</ModalTitle>
      <div className={contentStyles}>
        <div className={sideNavStyles}>
          <Sidebar
            activeItem={selectedSetting}
            onSelectItem={setSelectedSettings}
            items={settings.map((x) => x.name)}
          />
        </div>
        <div className={settingsStyles} data-testid="settings-content">
          {SettingComponent && <SettingComponent />}
        </div>
      </div>
      <ModalFooter>
        <Button
          data-testid="close-settings-button"
          onClick={() => setIsOpen(false)}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default connect(null, {
  onInit: fetchSettings,
})(SettingsModal);
