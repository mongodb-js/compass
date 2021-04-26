import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import SidebarStore from '../../../src/stores';
import Sidebar from '../../../src/components/sidebar';
import styles from '../../../src/components/sidebar/sidebar.less';

describe('Sidebar [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <Provider store={SidebarStore}>
        <Sidebar
          onCollapse={()=>{}}
        />
      </Provider>
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['compass-sidebar']}`)).to.exist;
  });
});
