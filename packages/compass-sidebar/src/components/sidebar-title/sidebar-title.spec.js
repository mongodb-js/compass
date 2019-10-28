import React from 'react';
import { shallow } from 'enzyme';
import SidebarTitle from './sidebar-title';

import styles from './sidebar-title.less';

describe('SidebarTitle [Component]', () => {
  context('when sidebar is collapsed', () => {
    const globalAppRegistryEmit = sinon.spy();
    const connectionModel = {
      connection: {
        authStrategy: 'MONGODB',
        isSrvRecord: false,
        readPreference: 'primaryPreferred',
        attributes: { hostanme: 'localhost' },
        isFavorite: false
      }
    };
    const isSidebarCollapsed = true;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitle
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders icon', () => {
      expect(component.find(`.${styles['sidebar-title']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-name']}`)).to.be.present();
      expect(component.find('FontAwesome[name="home"]')).to.be.present();
    });
  });

  context('when sidebar is not collapsed', () => {
    const globalAppRegistryEmit = sinon.spy();
    const connectionModel = {
      connection: {
        authStrategy: 'MONGODB',
        isSrvRecord: false,
        readPreference: 'primaryPreferred',
        attributes: { hostanme: 'localhost' },
        isFavorite: false
      }
    };
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitle
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders icon', () => {
      expect(component.find(`.${styles['sidebar-title']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-name']}`)).to.be.present();
      expect(component.find('FontAwesome[name="home"]')).to.be.not.present();
    });
  });
});
