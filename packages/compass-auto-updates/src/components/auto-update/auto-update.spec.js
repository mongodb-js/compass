import React from 'react';
import { mount } from 'enzyme';

import AutoUpdate from 'components/auto-update';
import store from 'stores';
import styles from './auto-update.less';

describe('AutoUpdate [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<AutoUpdate store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['auto-update']}`)).to.be.present();
  });
});
