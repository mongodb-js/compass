import React from 'react';
import { mount } from 'enzyme';

import classnames from 'classnames';
import styles from './sidebar-collection.less';
import SidebarCollection from 'components/sidebar-collection';

describe('SidebarCollection [Component]', () => {
  let component;
  let spy;
  let hold;
  describe('is not active', () => {
    beforeEach(() => {
      spy = sinon.spy();
      component = mount(<SidebarCollection
        _id="db.coll"
        database="db"
        capped={false}
        power_of_two={false}
        readonly={false}
        isWritable
        description="description"
        activeNamespace=""
      />);
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = {emit: spy};
    });
    afterEach(() => {
      component = null;
      spy = null;
      global.hadronApp.appRegistry = hold;
    });
    it('mounts the root element', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item'])}`)).to.be.present();
    });
    it('does not register as active', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-is-active'])}`)).to.be.not.present();
    });
    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.equal('coll ');
    });
    it('does not register as readonly', () => {
      expect(component.find('[data-test-id="sidebar-collection-is-readonly"]')).to.be.not.present();
    });
    it('triggers drop collection when clicked', () => {
      component.find('[data-test-id="compass-sidebar-icon-drop-collection"]').simulate('click');
      expect(spy.called).to.equal(true);
      expect(spy.args[0]).to.deep.equal(['open-drop-collection', 'db', 'coll']);
    });
  });
  describe('is active', () => {
    beforeEach(() => {
      component = mount(<SidebarCollection
        _id="db.coll"
        database="db"
        capped={false}
        power_of_two={false}
        readonly={false}
        isWritable
        description="description"
        activeNamespace="db.coll"
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('registers as active', () => {
      expect(component.find(`.${classnames(styles['compass-sidebar-item-is-active'])}`)).to.be.present();
    });
    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.equal('coll ');
    });
  });
  describe('is readonly', () => {
    beforeEach(() => {
      spy = sinon.spy();
      component = mount(<SidebarCollection
        _id="db.coll"
        database="db"
        capped={false}
        power_of_two={false}
        readonly
        isWritable={false}
        description="description"
        activeNamespace="db.coll"
      />);
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = {emit: spy};
    });
    afterEach(() => {
      component = null;
      spy = null;
      global.hadronApp.appRegistry = hold;
    });
    it('sets collection name', () => {
      expect(component.find('[data-test-id="sidebar-collection"]').text()).to.equal('coll ');
    });
    it('registers as readonly', () => {
      expect(component.find('[data-test-id="sidebar-collection-is-readonly"]')).to.be.present();
    });
    it('does not trigger drop collection when clicked', () => {
      component.find('[data-test-id="compass-sidebar-icon-drop-collection"]').simulate('click');
      expect(spy.called).to.equal(false);
    });
  });
});
