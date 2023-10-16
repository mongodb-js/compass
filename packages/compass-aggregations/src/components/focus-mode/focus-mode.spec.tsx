import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../test/configure-store';
import FocusMode from './focus-mode';
import { disableFocusMode, enableFocusMode } from '../../modules/focus-mode';

const renderFocusMode = () => {
  const store = configureStore({
    pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
  });
  render(
    <Provider store={store}>
      <FocusMode />
    </Provider>
  );
  return store;
};

describe('FocusMode', function () {
  it('does not show modal when closed', function () {
    const store = renderFocusMode();
    store.dispatch(disableFocusMode());
    expect(() => {
      screen.getByTestId('focus-mode-modal');
    }).to.throw;
  });

  it('shows modal when open', function () {
    const store = renderFocusMode();
    store.dispatch(enableFocusMode(0));
    expect(screen.getByTestId('focus-mode-modal')).to.exist;
  });

  it('hides modal when close button is clicked', function () {
    const store = renderFocusMode();
    store.dispatch(enableFocusMode(0));
    screen.getByLabelText(/close modal/i).click();

    expect(() => {
      screen.getByTestId('focus-mode-modal');
    }).to.throw;
  });
});
