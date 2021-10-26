import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import configureExportstore from '../../stores/export-store';
import ExportModal from './export-modal';

function renderModal(store) {
  return mount(
    <ExportModal store={store}/>
  );
}

describe('ExportModal Component', function() {
  let store;
  let state;

  beforeEach(function() {
    store = configureExportstore();
    state = store.getState();

    // all the state for all export stores is the same state until we make a copy here
    // (otherwise we break tests in other files)
    state.exportData = { ...state.exportData, isOpen: true };
  });

  it('should render zero results', function() {
    state.exportData.count = 0;
    const component = renderModal(store);
    const elements = component.find('[data-test-id="export-with-filters-label"]');
    expect(elements).to.have.lengthOf(1);
    expect(elements.first().text()).to.equal('Export query with filters — 0 results (Recommended)');
  });

  it('should render 5 results', function() {
    state.exportData.count = 5;
    const component = renderModal(store);
    const elements = component.find('[data-test-id="export-with-filters-label"]');
    expect(elements).to.have.lengthOf(1);
    expect(elements.first().text()).to.equal('Export query with filters — 5 results (Recommended)');
  });

  it('should render 5 results', function() {
    state.exportData.count = null;
    const component = renderModal(store);
    const elements = component.find('[data-test-id="export-with-filters-label"]');
    expect(elements).to.have.lengthOf(1);
    expect(elements.first().text()).to.equal('Export query with filters (Recommended)');
  });
});
