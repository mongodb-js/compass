import React from 'react';
import { shallow } from 'enzyme';

import InputPreviewToolbar from '../input-preview-toolbar';
import styles from './input-preview-toolbar.module.less';

describe('InputPreviewToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<InputPreviewToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-preview-toolbar']}`)).to.be.present();
  });
});
