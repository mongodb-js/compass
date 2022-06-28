import React, { useState } from 'react';
import { connect } from 'react-redux';

import {
  Modal,
  ModalTitle,
  ModalFooter,
  css,
  cx,
  spacing,
  uiColors,
  Button,
} from '@mongodb-js/compass-components';

import { toggleModal } from '../stores/modal';
import type { RootState } from '../stores';

import PrivacySettings from './privacy';
import ThemeSettings from './themes';

type SettingsModalProps = {
  isModalOpen: boolean;
  closeModal: () => void;
};

const contentStyles = css({
  display: 'flex',
  minHeight: '400px',
});

const sideNavStyles = css({
  width: '20%',
  ul: {
    li: {
      padding: spacing[2],
      borderRadius: spacing[1],
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: uiColors.yellow.base,
      },
      marginTop: spacing[1],
      marginBottom: spacing[1],
    },
  },
});

const activeItem = css({
  backgroundColor: uiColors.yellow.base,
});

const settingsStyles = css({
  width: '80%',
  padding: spacing[2],
});

type Settings = {
  name: string;
  component: React.ComponentType;
};

const CompassSettings: React.FunctionComponent<SettingsModalProps> = ({
  isModalOpen,
  closeModal,
}) => {
  const settings: Settings[] = [
    { name: 'Privacy', component: PrivacySettings },
    { name: 'Theme', component: ThemeSettings },
  ];

  const [selectedSetting, setSelectedSettings] = useState(settings[0].name);

  const SettingComponent =
    settings.find((x) => x.name === selectedSetting)?.component ?? null;

  return (
    <Modal size="large" open={isModalOpen} setOpen={closeModal}>
      <ModalTitle>Compass Settings</ModalTitle>
      <div className={contentStyles}>
        <div className={sideNavStyles}>
          <ul>
            {settings.map(({ name }) => (
              // eslint-disable jsx-a11y/click-events-have-key-events
              // eslint-disable jsx-a11y/no-noninteractive-element-interactions
              <li
                className={cx({
                  [activeItem]: name === selectedSetting,
                })}
                key={name}
                onClick={() => setSelectedSettings(name)}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
        <div className={settingsStyles}>
          <SettingComponent />
        </div>
      </div>
      <ModalFooter>
        <Button onClick={closeModal}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

const mapState = ({ modal: { isOpen } }: RootState) => ({
  isModalOpen: isOpen,
});

const mapDispatch = {
  closeModal: () => toggleModal(false),
};

export default connect(mapState, mapDispatch)(CompassSettings);
