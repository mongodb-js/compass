import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { configureStore } from '../stores/import-store';
import { Provider } from 'react-redux';

import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import ImportErrorDetailsModal from './import-error-details-modal';

function renderModal(importState: any = {}) {
  // TODO: mutating state directly doesn't guarantee that we are testing the
  // component in a state that can actually be achieved when actions are emitted
  // on the store. Refactor this to either test unconnected component, or to
  // not mutate state directly for tests
  const store = configureStore({
    dataService: {},
    globalAppRegistry: {},
    logger: createNoopLogger(),
    track: createNoopTrack(),
    connections: {
      getConnectionById: () => ({ info: { id: 'TEST' } }),
    },
  } as any);
  const state = store.getState();
  state.import = {
    ...state.import,
    ...importState,
  };
  const renderResult = render(
    <Provider store={store}>
      <ImportErrorDetailsModal />
    </Provider>
  );
  return { renderResult, store };
}

describe('ImportErrorDetailsModal Component', function () {
  context('When import error details are open', function () {
    const errorDetails = { details: 'abc' };

    beforeEach(function () {
      renderModal({
        errorDetails: {
          isOpen: true,
          details: errorDetails,
        },
      });
    });

    it('Should render error details and be closable', async function () {
      const codeDetails = await screen.findByTestId('error-details-json');
      expect(codeDetails).to.be.visible;
      expect(JSON.parse(codeDetails.textContent || '')).to.deep.equal(
        errorDetails
      );

      const closeBtn = await screen.findByRole('button', { name: 'Close' });
      expect(closeBtn).to.be.visible;

      userEvent.click(closeBtn);
      await waitFor(() => {
        expect(screen.queryByTestId('import-error-details-modal')).not.to.exist;
      });
    });
  });
});
