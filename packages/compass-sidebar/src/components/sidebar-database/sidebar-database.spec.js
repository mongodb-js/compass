import React from 'react';
import { mount } from 'enzyme';

import classnames from 'classnames';
import styles from './sidebar-database.less';
import SidebarDatabase from 'components/sidebar-database';
import SidebarCollection from 'components/sidebar-collection';

const COLLECTIONS = [
  {
    '_id': 'admin.citibikecoll',
    'database': 'admin',
    'capped': false,
    'power_of_two': false,
    'readonly': false
  },
  {
    '_id': 'admin.coll',
    'database': 'admin',
    'capped': false,
    'power_of_two': false,
    'readonly': false
  }
];

describe('SidebarDatabase [Component]', () => {
  let component;
  let emitSpy;
  let clickSpy;

  describe('when the db is not active', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      clickSpy = sinon.spy();
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace=""
        collections={COLLECTIONS}
        expanded={false}
        style={{}}
        onClick={clickSpy}
        globalAppRegistryEmit={emitSpy}
        index={0}
        isWritable
        isDataLake={false}
        description="description"
      />);
    });

    afterEach(() => {
      component = null;
      clickSpy = null;
      emitSpy = null;
    });

    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header'])}`)).to.be.present();
    });

    it('does not register as active', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header-is-active'])}`)).to.be.not.present();
    });

    it('sets db name', () => {
      expect(component.find('[data-test-id="sidebar-database"]').text()).to.equal('db');
    });

    it('is not expanded', () => {
      expect(component.find(SidebarCollection)).to.be.not.present();
    });

    it('expands on click', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-expand'])}`).simulate('click');
      expect(clickSpy.called).to.equal(true);
    });

    it('creates collection', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-create-collection'])}`).simulate('click');
      expect(emitSpy.calledWith('open-create-collection', 'db')).to.equal(true);
    });

    it('drops DB', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-drop-database'])}`).simulate('click');
      expect(emitSpy.calledWith('open-drop-database', 'db')).to.equal(true);
    });
  });

  describe('when the db is active', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      clickSpy = sinon.spy();
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace="db"
        collections={COLLECTIONS}
        expanded={false}
        style={{}}
        onClick={clickSpy}
        globalAppRegistryEmit={emitSpy}
        index={0}
        isWritable
        isDataLake={false}
        description="description"
      />);
    });

    afterEach(() => {
      component = null;
      clickSpy = null;
      emitSpy = null;
    });

    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header'])}`)).to.be.present();
    });

    it('does register as active', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header-is-active'])}`)).to.be.present();
    });
  });

  describe('is not writable', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      clickSpy = sinon.spy();
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace=""
        collections={COLLECTIONS}
        expanded={false}
        style={{}}
        onClick={clickSpy}
        globalAppRegistryEmit={emitSpy}
        index={0}
        isWritable={false}
        isDataLake={false}
        description="description"
      />);
    });

    afterEach(() => {
      component = null;
      clickSpy = null;
      emitSpy = null;
    });

    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header'])}`)).to.be.present();
    });

    it('does not create collection', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-create-collection'])}`).simulate('click');
      expect(emitSpy.called).to.equal(false);
    });

    it('does not drop DB', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-drop-database'])}`).simulate('click');
      expect(emitSpy.called).to.equal(false);
    });
  });

  describe('when the db is expanded', () => {
    beforeEach(() => {
      emitSpy = sinon.spy();
      clickSpy = sinon.spy();
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace="db"
        collections={COLLECTIONS}
        expanded
        style={{}}
        onClick={clickSpy}
        globalAppRegistryEmit={emitSpy}
        index={0}
        isWritable
        isDataLake={false}
        description="description"
      />);
    });

    afterEach(() => {
      component = null;
      clickSpy = null;
      emitSpy = null;
    });

    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header'])}`)).to.be.present();
    });

    it('renders the 2 collections', () => {
      expect(component.find(SidebarCollection).children().length).to.equal(2);
    });
  });
});
