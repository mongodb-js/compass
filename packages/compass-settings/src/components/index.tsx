import React from 'react';
import SettingsModal from './modal';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

const SettingsModalWithStore: React.FunctionComponent = () => {
  return (
    <>
      <ConfirmationModalArea>
        <SettingsModal />
      </ConfirmationModalArea>
    </>
  );
};

export default SettingsModalWithStore;
