import { mount } from 'enzyme';
import { expect } from 'chai';
import store from '../../stores/export-store';
import React from 'react';
import ExportModal from './'

function renderModal() {
  return mount(
    <ExportModal store={store}/>
  );
}

describe('ExportModal Component', function() {
  let state;

  beforeEach(function() {
    state = store.getState();

    // all the state for all export stores is the same state until we make a copy here
    // (otherwise we break tests in other files)
    state.exportData = { ...state.exportData, isOpen: true };
  });

  it('should render zero results', function() {
    state.exportData.count = 0;
    const component = renderModal();
    const elements = component.find('[data-test-id="export-with-filters-label"]');
    expect(elements).to.have.lengthOf(1);
    expect(elements.first().text()).to.equal('Export query with filters — 0 results (Recommended)');
  });

  it('should render 5 results', function() {
    state.exportData.count = 5;
    const component = renderModal();
    const elements = component.find('[data-test-id="export-with-filters-label"]');
    expect(elements).to.have.lengthOf(1);
    expect(elements.first().text()).to.equal('Export query with filters — 5 results (Recommended)');
  });

  it('should render recommended filters', function() {
    state.exportData.count = null;
    const component = renderModal();
    const elements = component.find('[data-test-id="export-with-filters-label"]');
    expect(elements).to.have.lengthOf(1);
    expect(elements.first().text()).to.equal('Export query with filters (Recommended)');
  });
});
