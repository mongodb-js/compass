import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ipc from 'hadron-ipc';

import {
  Modal,
  ModalTitle,
  ModalFooter,
  css,
  spacing,
  Button,
} from '@mongodb-js/compass-components';

import { toggleModal } from '../stores/modal';
import { fetchSettings } from '../stores/settings';
import type { RootState } from '../stores';

import PrivacySettings from './settings/privacy';
import ThemeSettings from './settings/themes';
import Sidebar from './sidebar';

type SettingsModalProps = {
  isModalOpen: boolean;
  toggleModal: (value: boolean) => void;
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

type Settings = {
  name: string;
  component: React.ComponentType;
};

export const SettingsModal: React.FunctionComponent<SettingsModalProps> = ({
  isModalOpen,
  toggleModal,
  onInit,
}) => {
  const settings: Settings[] = [
    { name: 'Privacy', component: PrivacySettings },
    { name: 'Theme', component: ThemeSettings },
  ];

  const [selectedSetting, setSelectedSettings] = useState(settings[0].name);

  const SettingComponent =
    settings.find((x) => x.name === selectedSetting)?.component ?? null;

  useEffect(() => {
    onInit();
  }, [onInit]);

  useEffect(() => {
    (ipc as any).on('window:show-network-optin', () => {
      toggleModal(true);
    });
  }, [toggleModal]);

  return (
    <Modal
      size="large"
      open={isModalOpen}
      setOpen={() => toggleModal(false)}
      data-testid="settings-modal"
    >
      <ModalTitle>Settings</ModalTitle>
      <div className={contentStyles}>
        <div className={sideNavStyles} data-testid="settings-sidebar">
          <Sidebar
            activeItem={selectedSetting}
            onSelectItem={setSelectedSettings}
            items={settings.map((x) => x.name)}
          />
        </div>
        <div className={settingsStyles} data-testid="settings-content">
          <SettingComponent />
        </div>
      </div>
      <ModalFooter>
        <Button
          data-testid="close-settings-button"
          onClick={() => toggleModal(false)}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const mapState = ({ modal: { isOpen } }: RootState) => ({
  isModalOpen: isOpen,
});

const mapDispatch = {
  toggleModal,
  onInit: fetchSettings,
};

export default connect(mapState, mapDispatch)(SettingsModal);
