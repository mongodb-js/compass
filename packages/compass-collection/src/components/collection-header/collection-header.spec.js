import React from 'react';
import { mount } from 'enzyme';

import CollectionHeader from 'components/collection-header';
import styles from './collection-header.less';

describe('CollectionHeader [Component]', () => {
  const statsPlugin = () => { return (<div/>); };

  context('when the collection is not readonly', () => {
    let component;
    const statsStore = {};
    const selectOrCreateTabSpy = sinon.spy();
    const sourceReadonly = false;

    beforeEach(() => {
      component = mount(
        <CollectionHeader
          isReadonly={false}
          statsPlugin={statsPlugin}
          statsStore={statsStore}
          namespace="db.coll"
          selectOrCreateTab={selectOrCreateTabSpy}
          sourceReadonly={sourceReadonly} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['collection-header']}`)).to.be.present();
    });

    it('renders the db name', () => {
      expect(component.find(`.${styles['collection-header-title-db']}`)).to.have.text('db');
    });

    it('renders the collection name', () => {
      expect(component.find(`.${styles['collection-header-title-collection']}`)).to.have.text('coll');
    });
  });

  context('when the collection is readonly', () => {
    let component;
    const statsStore = {};
    const selectOrCreateTabSpy = sinon.spy();
    const sourceReadonly = false;

    beforeEach(() => {
      component = mount(
        <CollectionHeader
          isReadonly
          sourceName="orig.coll"
          statsPlugin={statsPlugin}
          statsStore={statsStore}
          namespace="db.coll"
          selectOrCreateTab={selectOrCreateTabSpy}
          sourceReadonly={sourceReadonly} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['collection-header']}`)).to.be.present();
    });

    it('renders the db name', () => {
      expect(component.find(`.${styles['collection-header-title-db']}`)).
        to.have.text('db');
    });

    it('renders the collection name', () => {
      expect(component.find(`.${styles['collection-header-title-collection']}`)).
        to.have.text('coll');
    });

    it('renders the source collection', () => {
      expect(component.find(`.${styles['collection-header-title-readonly-on']}`)).
        to.have.text('(view on: orig.coll)');
    });

    it('renders the readonly icon', () => {
      expect(component.find('.fa-eye')).to.be.present();
    });
  });

  context('when the collection is readonly but not a view', () => {
    let component;
    const statsStore = {};
    const selectOrCreateTabSpy = sinon.spy();
    const sourceName = null;
    const sourceReadonly = false;

    beforeEach(() => {
      component = mount(
        <CollectionHeader
          isReadonly
          sourceName={sourceName}
          statsPlugin={statsPlugin}
          statsStore={statsStore}
          namespace="db.coll"
          selectOrCreateTab={selectOrCreateTabSpy}
          sourceReadonly={sourceReadonly} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not the source collection', () => {
      expect(component.find(`.${styles['collection-header-title-readonly-on']}`)).
        to.be.empty;
    });

    it('renders the readonly icon', () => {
      expect(component.find('.fa-eye')).to.be.present();
    });
  });
});
