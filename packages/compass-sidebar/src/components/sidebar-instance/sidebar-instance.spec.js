import React from 'react';
import { mount } from 'enzyme';

import SidebarInstance from 'components/sidebar-instance';
import styles from './sidebar-instance.less';

describe('SidebarInstance [Component]', () => {
  let component;
  describe('empty instance', () => {
    beforeEach(() => {
      component = mount(<SidebarInstance
        instance={{databases: null, collections: null}}
        isExpanded
        isGenuineMongoDB
        detailsPlugins={[]}
        globalAppRegistryEmit={() => {}}
        toggleIsDetailsExpanded={() => {}}
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('renders the container', () => {
      expect(component.find(`.${styles['sidebar-instance']}`)).to.be.present();
    });
  });
});
