import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import SidebarInstance from '../../../src/components/sidebar-instance';
import styles from '../../../src/components/sidebar-instance/sidebar-instance.module.less';

describe.skip('SidebarInstance [Component]', function () {
  let component;

  describe('empty instance', function () {
    beforeEach(function () {
      component = mount(
        <SidebarInstance
          instance={{ databases: null, collections: null }}
          isExpanded
          isGenuineMongoDB
          isSidebarCollapsed={false}
          detailsPlugins={[]}
          globalAppRegistryEmit={() => {}}
          toggleIsDetailsExpanded={() => {}}
          connectionInfo={{
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
            id: '123',
          }}
          updateConnectionInfo={() => {}}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the container', function () {
      expect(component.find(`.${styles['sidebar-instance']}`)).to.exist;
    });
  });
});
