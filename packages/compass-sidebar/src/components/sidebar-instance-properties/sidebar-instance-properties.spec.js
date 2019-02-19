import React from 'react';
import { mount } from 'enzyme';

import SidebarInstanceProperties from 'components/sidebar-instance-properties';

describe('SidebarInstanceProperties [Component]', () => {
  let component;
  let refreshSpy;
  describe('empty instance', () => {
    beforeEach(() => {
      component = mount(<SidebarInstanceProperties
        instance={{databases: null, collections: null}}
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('counts collections correctly', () => {
      expect(component.find('[data-test-id="sidebar-collection-count"]')).to.be.present();
      expect(component.find('[data-test-id="sidebar-collection-count"]').text()).to.equal('-');
    });
    it('counts dbs correctly', () => {
      expect(component.find('[data-test-id="sidebar-db-count"]')).to.be.present();
      expect(component.find('[data-test-id="sidebar-db-count"]').text()).to.equal('-');
    });
  });
  describe('nonempty instance', () => {
    beforeEach(() => {
      component = mount(<SidebarInstanceProperties
        instance={{databases: [1, 2, 3], collections: [6, 7]}}
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('counts collections correctly', () => {
      expect(component.find('[data-test-id="sidebar-collection-count"]')).to.be.present();
      expect(component.find('[data-test-id="sidebar-collection-count"]').text()).to.equal('2');
    });
    it('counts dbs correctly', () => {
      expect(component.find('[data-test-id="sidebar-db-count"]')).to.be.present();
      expect(component.find('[data-test-id="sidebar-db-count"]').text()).to.equal('3');
    });
  });
  describe('nonempty instance', () => {
    let hold;
    beforeEach(() => {
      refreshSpy = sinon.spy();
      component = mount(<SidebarInstanceProperties
        instance={{databases: [1, 2, 3], collections: [6, 7]}}
      />);
      hold = global.hadronApp.appRegistry.getAction('App.InstanceAction');
      global.hadronApp.appRegistry.registerAction('App.InstanceActions', {refreshInstance: refreshSpy});
    });
    afterEach(() => {
      component = null;
      refreshSpy = null;
      if (hold) {
        global.hadronApp.appRegistry.registerAction('App.InstanceActions', hold);
      }
    });
    it('refreshes', () => {
      component.find('[data-test-id="instance-refresh-button"]').simulate('click');
      expect(refreshSpy.called).to.equal(true);
    });
  });
});
