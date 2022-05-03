import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import store from '../../stores/export-store';
import ExportModal from './export-modal';

function renderModal() {
  return mount(<ExportModal store={store} />);
}

describe('ExportModal Component', function () {
  let state;

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
      const component = renderModal();
      const elements = component.find(
        '[data-test-id="export-with-filters-label"]'
      );
      expect(elements).to.have.lengthOf(1);
      expect(elements.first().text()).to.equal(
        'Export query with filters — 0 results (Recommended)'
      );
    });

    it('should render 5 results', function () {
      state.exportData.count = 5;
      const component = renderModal();
      const elements = component.find(
        '[data-test-id="export-with-filters-label"]'
      );
      expect(elements).to.have.lengthOf(1);
      expect(elements.first().text()).to.equal(
        'Export query with filters — 5 results (Recommended)'
      );
    });

    it('should render "null count" results', function () {
      state.exportData.count = null;
      const component = renderModal();
      const elements = component.find(
        '[data-test-id="export-with-filters-label"]'
      );
      expect(elements).to.have.lengthOf(1);
      expect(elements.first().text()).to.equal(
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
      const modal = renderModal();
      expect(modal.find('[data-test-id="cancel-button"]')).to.have.lengthOf(1);
      expect(modal.find('[data-test-id="export-button"]')).to.have.lengthOf(1);
    });
  });
});
