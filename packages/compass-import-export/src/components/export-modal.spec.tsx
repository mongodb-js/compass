import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import store from '../stores/export-store';
import ExportModal from './export-modal';

function renderModal() {
  render(<ExportModal store={store} />);
}

describe('ExportModal Component', function () {
  let state: any;

  describe('Export Query', function () {
    beforeEach(function () {
      state = store.getState();

      // all the state for all export stores is the same state until we make a copy here
      // (otherwise we break tests in other files)
      state.exportData = {
        ...state.exportData,
        isOpen: true,
        query: { filter: {} },
      };
    });

    it('should render zero results', function () {
      state.exportData.count = 0;
      renderModal();
      const filterLabel = screen.getByTestId('export-option-filters');
      expect(filterLabel).to.be.visible;
      expect(filterLabel.textContent).to.contain(
        'Export query with filters — 0 results (Recommended)'
      );
    });

    it('should render 5 results', function () {
      state.exportData.count = 5;
      renderModal();
      const filterLabel = screen.getByTestId('export-option-filters');
      expect(filterLabel).to.be.visible;
      expect(filterLabel.textContent).to.contain(
        'Export query with filters — 5 results (Recommended)'
      );
    });

    it('should render "null count" results', function () {
      state.exportData.count = null;
      renderModal();
      const filterLabel = screen.getByTestId('export-option-filters');
      expect(filterLabel).to.be.visible;
      expect(filterLabel.textContent).to.contain(
        'Export query with filters (Recommended)'
      );
    });
  });

  describe('Export Aggregation', function () {
    beforeEach(function () {
      state = store.getState();
      state.exportData = {
        ...state.exportData,
        isOpen: true,
        query: null,
        isAggregation: true,
        exportStep: 'FILETYPE',
      };
    });
    it('renders modal on export screen', function () {
      renderModal();
      expect(screen.getByTestId('cancel-button')).be.visible;
      expect(screen.getByTestId('export-button')).be.visible;
    });
  });
});
