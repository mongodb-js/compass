import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { mount } from 'enzyme';
import SidebarInstanceStats from '../sidebar-instance-stats';
import styles from './sidebar-instance-stats.module.less';

describe('SidebarInstanceStats [Component]', function () {
  let component;
  let toggleSpy;
  let emitSpy;

  describe('empty instance', function () {
    beforeEach(function () {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(<SidebarInstanceStats
        instance={null}
        databases={[]}
        isExpanded
        toggleIsExpanded={toggleSpy}
        globalAppRegistryEmit={emitSpy}
      />);
    });

    afterEach(function () {
      toggleSpy = null;
      emitSpy = null;
      component = null;
    });

    it('counts collections correctly', function () {
      expect(component.find('#sidebar-instance-stats-collections')).to.have.text('-');
    });

    it('counts dbs correctly', function () {
      expect(component.find('#sidebar-instance-stats-dbs')).to.have.text('-');
    });
  });

  describe('nonempty instance', function () {
    beforeEach(function () {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(
        <SidebarInstanceStats
          instance={{
            status: 'ready',
          }}
          databases={[
            { collectionsLength: 2 },
            { collectionsLength: 2 },
            { collectionsLength: 1 },
          ]}
          isExpanded
          toggleIsExpanded={toggleSpy}
          globalAppRegistryEmit={emitSpy}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('counts collections correctly', function () {
      expect(component.find('#sidebar-instance-stats-collections')).to.have.text('5');
    });

    it('counts dbs correctly', function () {
      expect(component.find('#sidebar-instance-stats-dbs')).to.have.text('3');
    });
  });

  describe('ready instance', function () {
    beforeEach(function () {
      toggleSpy = sinon.spy();
      emitSpy = sinon.spy();
      component = mount(
        <SidebarInstanceStats
          instance={{
            status: 'ready',
          }}
          databases={[]}
          isExpanded
          toggleIsExpanded={toggleSpy}
          globalAppRegistryEmit={emitSpy}
        />
      );
    });

    afterEach(function () {
      toggleSpy = null;
      emitSpy = null;
      component = null;
    });

    it('refreshes', function () {
      component.find(`.${styles['sidebar-instance-stats-refresh-button']}`).simulate('click');
      expect(emitSpy.calledWith('refresh-data')).to.equal(true);
    });
  });
});
