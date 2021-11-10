import React from 'react';
import { mount } from 'enzyme';

import SidebarInstanceStats from '../sidebar-instance-stats';
import styles from './sidebar-instance-stats.module.less';

describe('SidebarInstanceStats [Component]', () => {
  let component;
  let toggleSpy;
  let emitSpy;

  describe('empty instance', () => {
    beforeEach(() => {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(<SidebarInstanceStats
        instance={null}
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
      component = mount(
        <SidebarInstanceStats
          instance={{
            status: 'ready',
            databases: [
              { collections: [1, 2] },
              { collections: [3, 4] },
              { collections: [5] },
            ],
          }}
          isExpanded
          toggleIsExpanded={toggleSpy}
          globalAppRegistryEmit={emitSpy}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('counts collections correctly', () => {
      expect(component.find('#sidebar-instance-stats-collections')).to.have.text('5');
    });

    it('counts dbs correctly', () => {
      expect(component.find('#sidebar-instance-stats-dbs')).to.have.text('3');
    });
  });

  describe('nonempty instance', () => {
    beforeEach(() => {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(
        <SidebarInstanceStats
          instance={{
            status: 'ready',
            databases: [],
          }}
          isExpanded
          toggleIsExpanded={toggleSpy}
          globalAppRegistryEmit={emitSpy}
        />
      );
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
