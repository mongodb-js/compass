import React from 'react';
import { mount } from 'enzyme';

import Sidebar from 'components/sidebar';
import styles from './sidebar.less';
import store from 'stores';

describe('Sidebar [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Sidebar store={store} onCollapse={()=>{}}/>);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['compass-sidebar']}`)).to.be.present();
  });
});
