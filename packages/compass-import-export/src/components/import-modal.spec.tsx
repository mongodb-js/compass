import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { configureStore } from '../stores/import-store';
import { openImport } from '../modules/import';
import ImportModal from './import-modal';

function renderModal() {
  const store = configureStore({
    globalAppRegistry: {},
    workspaces: {},
    logger: createNoopLogger(),
    track: createNoopTrack(),
    connections: {
      getConnectionById: () => ({ info: { id: 'TEST' } }),
    },
  } as any);
  render(
    <Provider store={store}>
      <ImportModal />
    </Provider>
  );
  return store;
}

describe('ImportModal Component', function () {
  let clickSpy: sinon.SinonSpy;

  beforeEach(function () {
    clickSpy = sinon.spy(HTMLInputElement.prototype, 'click');
  });

  afterEach(function () {
    clickSpy.restore();
    cleanup();
  });

  it('show the modal with a file button when opened without a file', async function () {
    const store = renderModal();

    store.dispatch(
      openImport({
        connectionId: 'TEST',
        namespace: 'test.coll',
        origin: 'menu',
      }) as any
    );

    expect(await screen.findByTestId('import-modal')).to.be.visible;
    expect(screen.getByRole('button', { name: /Select a file/ })).to.be.visible;
    expect(clickSpy).to.not.have.been.called;
  });
});
