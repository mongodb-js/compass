import React from 'react';
import { mount } from 'enzyme';

import ExportToLanguage from 'components/export-to-language';
import store from 'stores';

describe('ExportToLanguage [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<ExportToLanguage store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find('[data-test-id="export-to-language"]')).to.be.present();
  });
});
