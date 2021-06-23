import React from 'react';
import { mount } from 'enzyme';

import CollectionHeader from '../collection-header';
import styles from './collection-header.less';
import ReadOnlyBadge from './read-only-badge';
import TimeSeriesBadge from './time-series-badge';
import ViewBadge from './view-badge';
import ViewInformation from './view-information';

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
          globalAppRegistry={{}}
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

    it('does not render the readonly badge', () => {
      expect(component.find(ReadOnlyBadge)).to.not.be.present();
    });

    it('does not render the time series badge', () => {
      expect(component.find(TimeSeriesBadge)).to.not.be.present();
    });

    it('does not render the view badge', () => {
      expect(component.find(ViewBadge)).to.not.be.present();
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
          globalAppRegistry={{}}
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
      expect(
        component.find(ViewInformation)
      ).to.have.text('view on: orig.coll');
    });

    it('renders the readonly badge', () => {
      expect(component.find(ReadOnlyBadge)).to.be.present();
    });

    it('renders the view badge', () => {
      expect(component.find(ViewBadge)).to.be.present();
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
      expect(
        component.find(`.${styles['collection-header-title-readonly-on']}`)
      ).to.be.empty;
      expect(component.find(ViewInformation)).to.not.be.present();
    });

    it('renders the readonly badge', () => {
      expect(component.find(ReadOnlyBadge)).to.be.present();
    });

    it('does not render the view badge', () => {
      expect(component.find(ViewBadge)).to.not.be.present();
    });
  });

  context('when the collection is a time-series collection', () => {
    let component;
    const statsStore = {};
    const selectOrCreateTabSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <CollectionHeader
          isTimeSeries
          statsPlugin={statsPlugin}
          statsStore={statsStore}
          namespace="db.coll"
          selectOrCreateTab={selectOrCreateTabSpy}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not the source collection', () => {
      expect(
        component.find(`.${styles['collection-header-title-readonly-on']}`)
      ).to.be.empty;
      expect(component.find(ViewInformation)).to.not.be.present();
    });

    it('does not render the readonly badge', () => {
      expect(component.find(ReadOnlyBadge)).to.not.be.present();
    });

    it('renders the time-series badge', () => {
      expect(component.find(TimeSeriesBadge)).to.be.present();
    });
  });

  context('when the db name is clicked', () => {
    it('emits the open event to the app registry', () => {
      const statsStore = {};
      const selectOrCreateTabSpy = sinon.spy();
      const sourceReadonly = false;

      let emmittedEventName;
      let emmittedDbName;

      const component = mount(
        <CollectionHeader
          isReadonly={false}
          globalAppRegistry={{
            emit: (eventName, dbName) => {
              emmittedEventName = eventName;
              emmittedDbName = dbName;
            }
          }}
          sourceName="orig.coll"
          statsPlugin={statsPlugin}
          statsStore={statsStore}
          namespace="db.coll"
          selectOrCreateTab={selectOrCreateTabSpy}
          sourceReadonly={sourceReadonly} />
      );

      expect(component.find(`.${styles['collection-header-title-db']}`)).to.be.present();
      component.find(`.${styles['collection-header-title-db']}`).simulate('click');
      expect(emmittedEventName).to.equal('select-database');
      expect(emmittedDbName).to.equal('db');
    });
  });
});
