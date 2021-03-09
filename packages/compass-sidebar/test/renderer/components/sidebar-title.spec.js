import React from 'react';
import { mount, shallow } from 'enzyme';

import { SidebarTitle as SidebarTitleClass } from '../../../src/components/sidebar-title/sidebar-title';
import styles from '../../../src/components/sidebar-title/sidebar-title.less';

describe('SidebarTitle [Component]', () => {
  const connectionModel = {
    connection: {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      isFavorite: false
    }
  };

  context('when sidebar is collapsed', () => {
    const globalAppRegistryEmit = sinon.spy();
    const isSidebarCollapsed = true;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitleClass
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders icon', () => {
      expect(component.find(`.${styles['sidebar-title']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-name']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-is-active']}`)).to.not.be.present();
      expect(component.find('FontAwesome[name="home"]')).to.be.present();
    });
  });

  context('when sidebar is not collapsed', () => {
    const globalAppRegistryEmit = sinon.spy();
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitleClass
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed}
        />
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

  context('when the title is clicked', () => {
    const globalAppRegistryEmit = sinon.fake();
    const changeActiveNamespaceFake = sinon.fake();
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitleClass
          changeActiveNamespace={changeActiveNamespaceFake}
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      );

      component.find(`.${styles['sidebar-title']}`).simulate('click');
    });

    afterEach(() => {
      component = null;
    });

    it('sets the active namespace to empty', () => {
      expect(changeActiveNamespaceFake.called).to.equal(true);
      expect(changeActiveNamespaceFake.firstCall.args[0]).to.deep.equal('');
    });
  });

  context('when the sidebar title is active', () => {
    const globalAppRegistryEmit = sinon.fake();
    const changeActiveNamespaceFake = sinon.fake();
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = mount(
        <SidebarTitleClass
          activeNamespace={''}
          changeActiveNamespace={changeActiveNamespaceFake}
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      );

      component.find(`.${styles['sidebar-title']}`).simulate('click');
    });

    afterEach(() => {
      component = null;
    });

    it('has an active class', () => {
      expect(component.find(`.${styles['sidebar-title-is-active']}`)).to.be.present();
    });
  });
});
