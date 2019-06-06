import React from 'react';
import { mount } from 'enzyme';

import classnames from 'classnames';
import styles from './sidebar-database.less';
import SidebarDatabase from 'components/sidebar-database';
import SidebarCollection from 'components/sidebar-collection';

describe('SidebarDatabase [Component]', () => {
  let component;
  let spy;
  let appRegSpy;
  let hold;
  describe('is not active', () => {
    beforeEach(() => {
      spy = sinon.spy();
      appRegSpy = sinon.spy();
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = {emit: appRegSpy, getStore: () => {}};
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace=""
        collections={[{'_id': 'admin.citibikecoll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}, {'_id': 'admin.coll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}]}
        expanded={false}
        style={{}}
        onClick={spy}
        index={0}
        isWritable
        isDataLake={false}
        description="description"
      />);
    });
    afterEach(() => {
      component = null;
      spy = null;
      global.hadronApp.appRegistry = hold;
      appRegSpy = null;
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
      expect(spy.called).to.equal(true);
    });
    it('creates collection', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-create-collection'])}`).simulate('click');
      expect(appRegSpy.called).to.equal(true);
      expect(appRegSpy.args[0]).to.deep.equal(['open-create-collection', 'db']);
    });
    it('drops DB', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-drop-database'])}`).simulate('click');
      expect(appRegSpy.called).to.equal(true);
      expect(appRegSpy.args[0]).to.deep.equal(['open-drop-database', 'db']);
    });
  });
  describe('is active', () => {
    beforeEach(() => {
      spy = sinon.spy();
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace="db"
        collections={[{'_id': 'admin.citibikecoll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}, {'_id': 'admin.coll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}]}
        expanded={false}
        style={{}}
        onClick={spy}
        index={0}
        isWritable
        isDataLake={false}
        description="description"
      />);
    });
    afterEach(() => {
      component = null;
      spy = null;
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
      spy = sinon.spy();
      appRegSpy = sinon.spy();
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = {emit: appRegSpy, getStore: () => {}};
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace=""
        collections={[{'_id': 'admin.citibikecoll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}, {'_id': 'admin.coll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}]}
        expanded={false}
        style={{}}
        onClick={spy}
        index={0}
        isWritable={false}
        isDataLake={false}
        description="description"
      />);
    });
    afterEach(() => {
      component = null;
      spy = null;
      global.hadronApp.appRegistry = hold;
      appRegSpy = null;
    });
    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header'])}`)).to.be.present();
    });
    it('does not create collection', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-create-collection'])}`).simulate('click');
      expect(appRegSpy.called).to.equal(false);
    });
    it('does not drop DB', () => {
      component.find(`.${classnames(styles['compass-sidebar-icon-drop-database'])}`).simulate('click');
      expect(appRegSpy.called).to.equal(false);
    });
  });
  describe('is expanded', () => {
    beforeEach(() => {
      spy = sinon.spy();
      component = mount(<SidebarDatabase
        _id="db"
        activeNamespace="db"
        collections={[{'_id': 'admin.citibikecoll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}, {'_id': 'admin.coll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}]}
        expanded
        style={{}}
        onClick={spy}
        index={0}
        isWritable
        isDataLake={false}
        description="description"
      />);
    });
    afterEach(() => {
      component = null;
      spy = null;
    });
    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-header'])}`)).to.be.present();
    });
    it('renders the 2 collections', () => {
      expect(component.find(SidebarCollection).children().length).to.equal(2);
    });
  });
});
