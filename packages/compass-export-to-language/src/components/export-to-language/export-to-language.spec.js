import React from 'react';
import { mount } from 'enzyme';

import ExportToLanguage from 'components/export-to-language';
import ExportModal from 'components/export-modal';

import configureStore from 'stores';

describe('ExportToLanguage [Component]', () => {
  let component;
  let store;

  beforeEach(() => {
    store = configureStore();
    component = mount(<ExportToLanguage store={store} />);
  });

  afterEach(() => {
    store = null;
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find('[data-test-id="export-to-language"]')).to.be.present();
  });

  it('has export modal as a descendant', () => {
    expect(component.find('[data-test-id="export-to-language"]')).to.have.descendants(ExportModal);
  });
});
