import React from 'react';
import {
  cleanup,
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import sinon from 'sinon';
import { closeExport, openExport } from '../modules/export';
import { configureStore } from '../stores/export-store';
import { createFakeFileHandle } from '../../test/files';
import { ExportModal } from './export-modal';

function renderModal(exportState: any = {}) {
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
  state.export = {
    ...state.export,
    ...exportState,
  };
  const renderResult = render(
    <Provider store={store}>
      <ExportModal />
    </Provider>
  );
  return { renderResult, store };
}

describe('ExportModal Component', function () {
  afterEach(function () {
    cleanup();
  });

  describe('Export Query without Projection', function () {
    it('should render an next button and banner', function () {
      renderModal({
        status: 'select-field-options',
        isOpen: true,
        query: { filter: {} },
      });
      expect(screen.getByTestId('export-next-step-button')).to.be.visible;
      expect(screen.queryByTestId('export-projection-banner')).to.not.exist;
      expect(screen.queryByTestId('export-button')).to.not.exist;
    });
  });

  describe('Export Query with Projection', function () {
    it('should render an export button and banner', function () {
      renderModal({
        status: 'ready-to-export',
        isOpen: true,
        query: { filter: {}, projection: { _id: 0 } },
      });
      expect(screen.getByTestId('export-button')).to.be.visible;
      expect(screen.queryByTestId('export-next-step-button')).to.not.exist;
      expect(screen.getByTestId('export-close-export-button')).be.visible;
      expect(screen.getByTestId('export-projection-banner')).to.be.visible;
    });
  });

  describe('Export Full Collection', function () {
    it('should render an export button', function () {
      renderModal({
        exportFullCollection: true,
        namespace: 'orange.pineapple',
        status: 'ready-to-export',
        isOpen: true,
        query: { filter: {}, projection: { _id: 0 } },
      });
      expect(screen.getByTestId('export-button')).to.be.visible;
      expect(screen.queryByTestId('export-next-step-button')).to.not.exist;
      expect(screen.getByText('Collection orange.pineapple')).to.be.visible;
      expect(screen.getByTestId('export-close-export-button')).be.visible;
      expect(screen.queryByTestId('export-projection-banner')).to.not.exist;
    });
  });

  describe('Export Aggregation', function () {
    it('renders an export button', function () {
      renderModal({
        isOpen: true,
        query: undefined,
        namespace: 'orange.pineapple',
        aggregation: {
          stages: [
            {
              $match: {},
            },
          ],
        },
        status: 'ready-to-export',
      });
      expect(screen.queryByTestId('export-next-step-button')).to.not.exist;
      expect(screen.getByTestId('export-close-export-button')).be.visible;
      expect(screen.getByText('Aggregation on orange.pineapple')).to.be.visible;
      expect(screen.getByTestId('export-button')).be.visible;
      expect(screen.queryByTestId('export-projection-banner')).to.not.exist;
    });
  });

  describe('when the user clicks Export', function () {
    let showSaveFilePicker: sinon.SinonStub;

    beforeEach(function () {
      showSaveFilePicker = sinon.stub();
      (window as any).showSaveFilePicker = showSaveFilePicker;
      renderModal({
        status: 'ready-to-export',
        isOpen: true,
        namespace: 'test.coll',
        exportFullCollection: true,
      });
    });

    afterEach(function () {
      delete (window as any).showSaveFilePicker;
    });

    it('open the picked file for writing', async function () {
      const file = createFakeFileHandle('test.coll.json');
      const createWritable = sinon.spy(file.handle, 'createWritable');
      showSaveFilePicker.resolves(file.handle);

      userEvent.click(screen.getByTestId('export-button'));

      await waitFor(() => {
        expect(createWritable).to.have.been.calledOnce;
      });
      expect(showSaveFilePicker).to.have.been.calledOnceWith(
        sinon.match({ suggestedName: 'test.coll.json' })
      );
    });

    it('show an error when the file picker fails', async function () {
      showSaveFilePicker.rejects(
        new DOMException('Not allowed in this context', 'SecurityError')
      );

      userEvent.click(screen.getByTestId('export-button'));

      expect(
        await screen.findByText(
          'Error creating output file: Not allowed in this context'
        )
      ).to.be.visible;
    });

    it('not show an error when the user closes the file picker', async function () {
      showSaveFilePicker.rejects(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      userEvent.click(screen.getByTestId('export-button'));
      await waitFor(() => {
        expect(showSaveFilePicker).to.have.been.calledOnce;
      });

      expect(screen.queryByText(/Error creating output file/)).to.not.exist;
    });
  });

  it('should reset modal state when closed and re-opened', async function () {
    const { store } = renderModal();

    const openExportOptions = {
      connectionId: 'TEST',
      namespace: 'test.test',
      query: { filter: {} },
      origin: 'empty-state' as const,
      exportFullCollection: true,
    };

    store.dispatch(openExport(openExportOptions));

    await waitFor(() => {
      expect(screen.getByTestId('select-file-type-json')).to.have.attribute(
        'aria-checked',
        'true'
      );
      expect(screen.getByTestId('select-file-type-csv')).to.have.attribute(
        'aria-checked',
        'false'
      );
    });

    userEvent.click(screen.getByTestId('select-file-type-csv', {}), undefined, {
      // leafygreen adds pointer-events: none on actually clickable elements
      skipPointerEventsCheck: true,
    });

    await waitFor(() => {
      expect(screen.getByTestId('select-file-type-csv')).to.have.attribute(
        'aria-checked',
        'true'
      );
    });

    store.dispatch(closeExport());
    await waitFor(() => {
      expect(screen.queryByTestId('select-file-type-json')).to.not.exist;
    });

    store.dispatch(openExport(openExportOptions));

    await waitFor(() => {
      expect(screen.getByTestId('select-file-type-json')).to.have.attribute(
        'aria-checked',
        'true'
      );
      expect(screen.getByTestId('select-file-type-csv')).to.have.attribute(
        'aria-checked',
        'false'
      );
    });
  });
});
