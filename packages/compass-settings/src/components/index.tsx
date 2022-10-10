import React from 'react';
import SettingsModal from './modal';
import { Provider } from 'react-redux';
import store from '../stores';

const WithStore: React.FunctionComponent<{
  isOpen: boolean;
  closeModal: () => void;
}> = ({ isOpen, closeModal }) => {
  return (
    <Provider store={store}>
      <SettingsModal isOpen={isOpen} closeModal={closeModal} />
    </Provider>
  );
};

export default WithStore;
