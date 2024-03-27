import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../test/configure-store';
import FocusMode from './focus-mode';
import { disableFocusMode, enableFocusMode } from '../../modules/focus-mode';
import { ConnectionInfoProvider } from '@mongodb-js/connection-storage/provider';

const renderFocusMode = () => {
  const store = configureStore({
    pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
  });
  render(
    <ConnectionInfoProvider
      value={{
        id: '1234',
        connectionOptions: {
          connectionString: 'mongodb://webscales.com:27017',
        },
      }}
    >
      <Provider store={store}>
        <FocusMode />
      </Provider>
    </ConnectionInfoProvider>
  );
  return store;
};

describe('FocusMode', function () {
  it('does not show modal when closed', function () {
    const store = renderFocusMode();
    store.dispatch(disableFocusMode() as any);
    expect(() => {
      screen.getByTestId('focus-mode-modal');
    }).to.throw;
  });

  it('shows modal when open', function () {
    const store = renderFocusMode();
    store.dispatch(enableFocusMode(0) as any);
    expect(screen.getByTestId('focus-mode-modal')).to.exist;
  });

  it('hides modal when close button is clicked', function () {
    const store = renderFocusMode();
    store.dispatch(enableFocusMode(0) as any);
    screen.getByLabelText(/close modal/i).click();

    expect(() => {
      screen.getByTestId('focus-mode-modal');
    }).to.throw;
  });
});
