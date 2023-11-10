import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { configureStore } from '../stores/export-store';
import { ExportModal } from './export-modal';
import { Provider } from 'react-redux';
import { closeExport, openExport } from '../modules/export';

function renderModal(exportState: any = {}) {
  // TODO: mutating state directly doesn't guarantee that we are testing the
  // component in a state that can actually be achieved when actions are emitted
  // on the store. Refactor this to either test unconnected component, or to
  // not mutate state directly for tests
  const store = configureStore({
    dataService: {},
    globalAppRegistry: {},
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

  it('should reset modal state when closed and re-opened', function () {
    const { store } = renderModal();

    const openExportOptions = {
      namespace: 'test.test',
      query: { filter: {} },
      origin: 'empty-state' as const,
      exportFullCollection: true,
    };

    store.dispatch(openExport(openExportOptions));

    expect(screen.getByTestId('select-file-type-json')).to.have.attribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByTestId('select-file-type-csv')).to.have.attribute(
      'aria-checked',
      'false'
    );

    userEvent.click(screen.getByTestId('select-file-type-csv', {}), undefined, {
      // leafygreen adds pointer-events: none on actually clickable elements
      skipPointerEventsCheck: true,
    });

    expect(screen.getByTestId('select-file-type-csv')).to.have.attribute(
      'aria-checked',
      'true'
    );

    // Re-open the modal to reset state
    store.dispatch(closeExport());
    store.dispatch(openExport(openExportOptions));

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
