import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import InputPreviewToolbar from '../input-preview-toolbar';
import styles from './input-preview-toolbar.module.less';

describe('InputPreviewToolbar [Component]', function() {
  let component;

  beforeEach(function() {
    component = shallow(<InputPreviewToolbar />);
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-preview-toolbar']}`)).to.be.present();
  });
});
