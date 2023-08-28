import React from 'react';
import SettingsModal from './modal';
import { Provider } from 'react-redux';
import store from '../stores';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

const SettingsModalWithStore: React.FunctionComponent = () => {
  return (
    <Provider store={store}>
      <ConfirmationModalArea>
        <SettingsModal />
      </ConfirmationModalArea>
    </Provider>
  );
};

export default SettingsModalWithStore;
