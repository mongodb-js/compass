import React from 'react';
import { mount } from 'enzyme';
import SidebarInstance from '../../../src/components/sidebar-instance';
import styles from '../../../src/components/sidebar-instance/sidebar-instance.module.less';

describe('SidebarInstance [Component]', () => {
  let component;

  describe('empty instance', () => {
    beforeEach(() => {
      component = mount(<SidebarInstance
        instance={{databases: null, collections: null}}
        isExpanded
        isGenuineMongoDB
        isSidebarCollapsed={false}
        detailsPlugins={[]}
        globalAppRegistryEmit={() => {}}
        toggleIsDetailsExpanded={() => {}}
        connectionModel={{ connection: {} }}
        toggleIsModalVisible={() => {}}
        saveFavorite={() => {}}
        isModalVisible={false}
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the container', () => {
      expect(component.find(`.${styles['sidebar-instance']}`)).to.exist;
    });
  });
});
