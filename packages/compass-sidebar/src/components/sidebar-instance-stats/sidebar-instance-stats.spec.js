import React from 'react';
import { mount } from 'enzyme';

import SidebarInstanceStats from 'components/sidebar-instance-stats';
import styles from './sidebar-instance-stats.less';

describe('SidebarInstanceStats [Component]', () => {
  let component;
  let toggleSpy;
  let emitSpy;

  describe('empty instance', () => {
    beforeEach(() => {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(<SidebarInstanceStats
        instance={{databases: null, collections: null}}
        isExpanded
        toggleIsExpanded={toggleSpy}
        globalAppRegistryEmit={emitSpy}
      />);
    });

    afterEach(() => {
      toggleSpy = null;
      emitSpy = null;
      component = null;
    });

    it('counts collections correctly', () => {
      expect(component.find('#sidebar-instance-stats-collections')).to.have.text('-');
    });

    it('counts dbs correctly', () => {
      expect(component.find('#sidebar-instance-stats-dbs')).to.have.text('-');
    });
  });

  describe('nonempty instance', () => {
    beforeEach(() => {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(<SidebarInstanceStats
        instance={{databases: [1, 2, 3], collections: [6, 7]}}
        isExpanded
        toggleIsExpanded={toggleSpy}
        globalAppRegistryEmit={emitSpy}
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('counts collections correctly', () => {
      expect(component.find('#sidebar-instance-stats-collections')).to.have.text('2');
    });

    it('counts dbs correctly', () => {
      expect(component.find('#sidebar-instance-stats-dbs')).to.have.text('3');
    });
  });

  describe('nonempty instance', () => {
    beforeEach(() => {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(<SidebarInstanceStats
        instance={{databases: [1, 2, 3], collections: [6, 7]}}
        isExpanded
        toggleIsExpanded={toggleSpy}
        globalAppRegistryEmit={emitSpy}
      />);
    });

    afterEach(() => {
      toggleSpy = null;
      emitSpy = null;
      component = null;
    });

    it('refreshes', () => {
      component.find(`.${styles['sidebar-instance-stats-refresh-button']}`).simulate('click');
      expect(emitSpy.calledWith('refresh-data')).to.equal(true);
    });
  });
});
