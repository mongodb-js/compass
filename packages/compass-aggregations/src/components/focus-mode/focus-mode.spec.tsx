import React from 'react';
import { cleanup, screen, waitFor } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { renderWithStore } from '../../../test/configure-store';
import FocusMode from './focus-mode';
import { disableFocusMode, enableFocusMode } from '../../modules/focus-mode';

const renderFocusMode = async () => {
  const result = await renderWithStore(<FocusMode />, {
    pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
  });
  return result.plugin.store;
};

describe('FocusMode', function () {
  afterEach(cleanup);

  it('does not show modal when closed', async function () {
    const store = await renderFocusMode();
    store.dispatch(disableFocusMode() as any);
    await waitFor(() => {
      expect(() => {
        screen.getByTestId('focus-mode-modal');
      }).to.throw;
    });
  });

  it('shows modal when open', async function () {
    const store = await renderFocusMode();
    store.dispatch(enableFocusMode(0));
    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-modal')).to.exist;
    });
  });

  it('hides modal when close button is clicked', async function () {
    const store = await renderFocusMode();
    store.dispatch(enableFocusMode(0) as any);

    await waitFor(() => {
      screen.getByLabelText(/close modal/i).click();
    });

    expect(() => {
      screen.getByTestId('focus-mode-modal');
    }).to.throw;
  });
});
