import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

import CollectionTab from '../collection-tab';
import styles from './collection-tab.module.less';

describe('CollectionTab [Component]', () => {
  const localAppRegistry = new AppRegistry();

  context('when the tab is active', () => {
    let component;
    let closeTabSpy;
    let selectTabSpy;
    let moveTabSpy;

    beforeEach(() => {
      closeTabSpy = sinon.spy();
      selectTabSpy = sinon.spy();
      moveTabSpy = sinon.spy();
      component = mount(
        <CollectionTab
          namespace="db.coll"
          activeSubTabName="Documents"
          isActive
          isReadonly={false}
          index={1}
          localAppRegistry={localAppRegistry}
          closeTab={closeTabSpy}
          moveTab={moveTabSpy}
          selectTab={selectTabSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the active wrapper div', () => {
      expect(component.find(`.${styles['collection-tab-is-active']}`)).to.be.present();
    });

    it('renders the namespace', () => {
      expect(component.find(`.${styles['collection-tab-info-ns']}`)).to.have.text('db.coll');
    });

    it('renders the subtab', () => {
      expect(component.find(`.${styles['collection-tab-info-subtab']}`)).to.have.text('Documents');
    });

    context('when clicking on close tab', () => {
      it('calls the action', () => {
        component.find(`.${styles['collection-tab-close']}`).simulate('click');
        expect(closeTabSpy.calledWith(1)).to.equal(true);
      });
    });

    context('when clicking on select tab', () => {
      it('calls the action', () => {
        component.find(`.${styles['collection-tab-info']}`).simulate('click');
        expect(selectTabSpy.calledWith(1)).to.equal(true);
      });
    });
  });

  context('when the tab is not active', () => {
    let component;
    let closeTabSpy;
    let selectTabSpy;
    let moveTabSpy;

    beforeEach(() => {
      closeTabSpy = sinon.spy();
      selectTabSpy = sinon.spy();
      moveTabSpy = sinon.spy();
      component = mount(
        <CollectionTab
          namespace="db.coll"
          activeSubTabName="Documents"
          isActive={false}
          isReadonly={false}
          index={1}
          localAppRegistry={localAppRegistry}
          closeTab={closeTabSpy}
          moveTab={moveTabSpy}
          selectTab={selectTabSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['collection-tab']}`)).to.be.present();
    });

    it('does not render the active div', () => {
      expect(component.find(`.${styles['collection-tab-is-active']}`)).to.not.be.present();
    });

    it('renders the namespace', () => {
      expect(component.find(`.${styles['collection-tab-info-ns']}`)).to.have.text('db.coll');
    });

    it('renders the subtab', () => {
      expect(component.find(`.${styles['collection-tab-info-subtab']}`)).to.have.text('Documents');
    });

    context('when clicking on close tab', () => {
      it('calls the action', () => {
        component.find(`.${styles['collection-tab-close']}`).simulate('click');
        expect(closeTabSpy.calledWith(1)).to.equal(true);
      });
    });

    context('when clicking on select tab', () => {
      it('calls the action', () => {
        component.find(`.${styles['collection-tab-info']}`).simulate('click');
        expect(selectTabSpy.calledWith(1)).to.equal(true);
      });
    });
  });

  context('when the collection is readonly', () => {
    let component;
    let closeTabSpy;
    let selectTabSpy;
    let moveTabSpy;

    beforeEach(() => {
      closeTabSpy = sinon.spy();
      selectTabSpy = sinon.spy();
      moveTabSpy = sinon.spy();
      component = mount(
        <CollectionTab
          namespace="db.coll"
          subTab="Documents"
          activeSubTabName="Documents"
          isActive
          index={1}
          isReadonly
          localAppRegistry={localAppRegistry}
          closeTab={closeTabSpy}
          moveTab={moveTabSpy}
          selectTab={selectTabSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the readonly icon', () => {
      expect(component.find(`.${styles['collection-tab-info-view-icon']}`)).to.be.present();
    });
  });
});
