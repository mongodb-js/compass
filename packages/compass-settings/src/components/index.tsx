import React from 'react';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import SettingsModal from './modal';

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
