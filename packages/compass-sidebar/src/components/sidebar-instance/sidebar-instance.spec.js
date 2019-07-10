import React from 'react';
import { mount } from 'enzyme';

import SidebarInstance from 'components/sidebar-instance';

describe('SidebarInstance [Component]', () => {
  let component;
  describe('empty instance', () => {
    beforeEach(() => {
      component = mount(<SidebarInstance
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
      component = mount(<SidebarInstance
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
    beforeEach(() => {
      sinon.spy(global.hadronApp.appRegistry, 'emit');
      component = mount(<SidebarInstance
        instance={{databases: [1, 2, 3], collections: [6, 7]}}
      />);
    });
    afterEach(() => {
      component = null;
      global.hadronApp.appRegistry.emit.restore();
    });
    it('refreshes', () => {
      component.find('[data-test-id="instance-refresh-button"]').simulate('click');
      expect(global.hadronApp.appRegistry.emit.calledOnce).to.equal(true);
      expect(global.hadronApp.appRegistry.emit.args[0][0]).to.equal('refresh-data');
    });
  });
});
