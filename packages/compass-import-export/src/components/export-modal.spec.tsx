import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import { store } from '../stores/export-store';
import { ExportModal } from './export-modal';
import { Provider } from 'react-redux';

function renderModal() {
  render(
    <Provider store={store}>
      <ExportModal />
    </Provider>
  );
}

describe('ExportModal Component', function () {
  describe('Export Query without Projection', function () {
    beforeEach(function () {
      const state = store.getState();

      state.export = {
        ...state.export,
        status: 'select-field-options',
        isOpen: true,
        query: { filter: {} },
      };
    });

    it('should render an next button and banner', function () {
      renderModal();
      expect(screen.getByTestId('export-next-step-button')).to.be.visible;
      expect(screen.queryByTestId('export-projection-banner')).to.not.exist;
      expect(screen.queryByTestId('export-button')).to.not.exist;
    });
  });

  describe('Export Query with Projection', function () {
    beforeEach(function () {
      const state = store.getState();

      state.export = {
        ...state.export,
        status: 'ready-to-export',
        isOpen: true,
        query: { filter: {}, projection: { _id: 0 } },
      };
    });

    it('should render an export button and banner', function () {
      renderModal();
      expect(screen.getByTestId('export-button')).to.be.visible;
      expect(screen.queryByTestId('export-next-step-button')).to.not.exist;
      expect(screen.getByTestId('export-close-export-button')).be.visible;
      expect(screen.getByTestId('export-projection-banner')).to.be.visible;
    });
  });

  describe('Export Full Collection', function () {
    beforeEach(function () {
      const state = store.getState();

      state.export = {
        ...state.export,
        exportFullCollection: true,
        namespace: 'orange.pineapple',
        status: 'ready-to-export',
        isOpen: true,
        query: { filter: {}, projection: { _id: 0 } },
      };
    });

    it('should render an export button', function () {
      renderModal();
      expect(screen.getByTestId('export-button')).to.be.visible;
      expect(screen.queryByTestId('export-next-step-button')).to.not.exist;
      expect(screen.getByText('Collection orange.pineapple')).to.be.visible;
      expect(screen.getByTestId('export-close-export-button')).be.visible;
      expect(screen.queryByTestId('export-projection-banner')).to.not.exist;
    });
  });

  describe('Export Aggregation', function () {
    beforeEach(function () {
      const state = store.getState();
      state.export = {
        ...state.export,
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
      };
    });
    it('renders an export button', function () {
      renderModal();
      expect(screen.queryByTestId('export-next-step-button')).to.not.exist;
      expect(screen.getByTestId('export-close-export-button')).be.visible;
      expect(screen.getByText('Aggregation on orange.pineapple')).to.be.visible;
      expect(screen.getByTestId('export-button')).be.visible;
      expect(screen.queryByTestId('export-projection-banner')).to.not.exist;
    });
  });
});
