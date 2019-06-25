import React from 'react';
import { mount } from 'enzyme';

import Sidebar from 'components/sidebar';
import styles from './sidebar.less';
import store from 'stores';

const Header = () => {
  return (<div />);
};

describe('Sidebar [Component]', () => {
  let component;

  beforeEach(() => {
    global.hadronApp.appRegistry.registerComponent('InstanceHeader.Component', Header);
    component = mount(<Sidebar store={store} onCollapse={()=>{}}/>);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['compass-sidebar']}`)).to.be.present();
  });
});
