import React from 'react';
import SettingsModal from './modal';
import { Provider } from 'react-redux';
import store from '../stores';

const SettingsModalWithStore: React.FunctionComponent = () => {
  return (
    <Provider store={store}>
      <SettingsModal />
    </Provider>
  );
};

export default SettingsModalWithStore;
