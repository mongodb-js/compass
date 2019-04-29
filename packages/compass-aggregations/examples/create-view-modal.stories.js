import React from 'react';
import { storiesOf } from '@storybook/react';

import { Provider } from 'react-redux';
import { INITIAL_STATE } from 'modules/create-view';
import CreateViewModal from 'components/create-view-modal';

import { configureCreateViewStore as configureStore } from 'utils/configureStore';

const BASE_STATE = {
  ...INITIAL_STATE
};

storiesOf('Components/Create View', module)
  .add('Visible', () => {
    const store = configureStore({
      ...BASE_STATE,
      isVisible: true
    });
    return (
      <Provider store={store}>
        <CreateViewModal />
      </Provider>
    );
  })
  .add('Loading', () => {
    const store = configureStore({
      ...BASE_STATE,
      isVisible: true,
      isRunning: true,
      name: 'myView'
    });
    return (
      <Provider store={store}>
        <CreateViewModal />
      </Provider>
    );
  })
  .add('Error', () => {
    const store = configureStore({
      ...BASE_STATE,
      isVisible: true,
      name: 'myView',
      error: {
        message: 'meeep!! Whats the error message?!'
      }
    });
    return (
      <Provider store={store}>
        <CreateViewModal />
      </Provider>
    );
  })
  .add('Default', () => {
    const store = configureStore({
      ...BASE_STATE
    });
    return (
      <Provider store={store}>
        <CreateViewModal />
      </Provider>
    );
  });
