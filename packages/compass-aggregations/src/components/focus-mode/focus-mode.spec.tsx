import React from 'react';
import { cleanup, screen, waitFor } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

import { renderWithStore } from '../../../test/configure-store';
import FocusMode from './focus-mode';
import { disableFocusMode, enableFocusMode } from '../../modules/focus-mode';

const renderFocusMode = async (
  services: Parameters<typeof renderWithStore>[3] = {}
) => {
  const result = await renderWithStore(
    <FocusMode />,
    { pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }] },
    undefined,
    services
  );
  return result.plugin.store;
};

describe('FocusMode', function () {
  afterEach(cleanup);

  it('does not show modal when closed', async function () {
    const store = await renderFocusMode();
    store.dispatch(disableFocusMode());
    expect(screen.getByTestId('focus-mode-modal')).to.be.closed;
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
    store.dispatch(enableFocusMode(0));

    await waitFor(() => {
      screen.getByLabelText(/close modal/i).click();
    });

    expect(screen.queryByTestId('focus-mode-modal')).to.be.closed;
  });

  context('rerank first stage banner', function () {
    it('shows banner when $rerank is the first stage and enableRerank is true', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({ enableRerank: true });
      const result = await renderWithStore(
        <FocusMode />,
        { pipeline: [{ $rerank: {} }] },
        undefined,
        { preferences }
      );
      result.plugin.store.dispatch(enableFocusMode(0));

      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-rerank-first-stage-banner')).to
          .exist;
      });
    });
  });
});
