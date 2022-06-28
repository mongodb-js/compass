import React from 'react';
import SettingsModal from './modal';
import { Provider } from 'react-redux';
import store from '../stores';

const WithStore: React.FunctionComponent = () => {
  return (
    <Provider store={store}>
      <SettingsModal></SettingsModal>
    </Provider>
  );
};

export default WithStore;
