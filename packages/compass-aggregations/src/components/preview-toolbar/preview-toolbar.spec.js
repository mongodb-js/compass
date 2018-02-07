import React from 'react';
import { shallow } from 'enzyme';

import PreviewToolbar from 'components/preview-toolbar';
import styles from './preview-toolbar.less';

describe('PreviewToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PreviewToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['preview-toolbar']}`)).to.be.present();
  });
});
