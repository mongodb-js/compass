import React from 'react';
import { shallow } from 'enzyme';

import BuilderToolbar from 'components/builder-toolbar';
import styles from './builder-toolbar.less';

describe('BuilderToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<BuilderToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['builder-toolbar']}`)).to.be.present();
  });
});
