import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import {
  LogoMark
} from '@mongodb-js/compass-components';

import { SidebarTitle as SidebarTitleClass } from '../../../src/components/sidebar-title/sidebar-title';
import styles from '../../../src/components/sidebar-title/sidebar-title.module.less';

describe('SidebarTitle [Component]', () => {
  const connectionInfo = {
    connectionOptions: {
      connectionString: 'mongodb://localhost:27020?readPreference=primaryPreferred'
    },
    id: '123'
  };

  context('when sidebar is collapsed', () => {
    const globalAppRegistryEmit = sinon.spy();
    const isSidebarExpanded = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitleClass
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionInfo={connectionInfo}
          isSidebarExpanded={isSidebarExpanded}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders icon', () => {
      expect(component.find(`.${styles['sidebar-title']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-name']}`)).to.not.be.present();
      expect(component.find(`.${styles['sidebar-title-logo']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-is-active']}`)).to.not.be.present();
      expect(component.find(LogoMark)).to.be.present();
    });
  });

  context('when sidebar is expanded', () => {
    const globalAppRegistryEmit = sinon.spy();
    const isSidebarExpanded = true;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitleClass
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionInfo={connectionInfo}
          isSidebarExpanded={isSidebarExpanded}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders icon', () => {
      expect(component.find(`.${styles['sidebar-title']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-name']}`)).to.be.present();
      expect(component.find(`.${styles['sidebar-title-logo']}`)).to.not.be.present();
      expect(component.find(LogoMark)).to.be.not.present();
    });
  });

  context('when the title is clicked', () => {
    const globalAppRegistryEmit = sinon.fake();
    const changeActiveNamespaceFake = sinon.fake();
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarTitleClass
          changeActiveNamespace={changeActiveNamespaceFake}
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionInfo={connectionInfo}
          isSidebarExpanded
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
    let component;

    beforeEach(() => {
      component = mount(
        <SidebarTitleClass
          activeNamespace={''}
          changeActiveNamespace={changeActiveNamespaceFake}
          globalAppRegistryEmit={globalAppRegistryEmit}
          connectionInfo={connectionInfo}
          isSidebarExpanded
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
