import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ExportToLanguage from '../export-to-language';
import ExportModal from '../export-modal';

import configureStore from '../../stores';

describe('ExportToLanguage [Component]', function () {
  let component;
  let store;

  beforeEach(function () {
    store = configureStore();
    component = mount(<ExportToLanguage store={store} />);
  });

  afterEach(function () {
    store = null;
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(
      component.find('[data-testid="export-to-language"]')
    ).to.be.present();
  });

  it('has export modal as a descendant', function () {
    expect(
      component.find('[data-testid="export-to-language"]')
    ).to.have.descendants(ExportModal);
  });
});
