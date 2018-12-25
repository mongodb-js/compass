import React from 'react';
import { mount } from 'enzyme';

import Toolbar from 'components/toolbar';
import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Toolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.toolbar}`)).to.be.present();
  });
});
