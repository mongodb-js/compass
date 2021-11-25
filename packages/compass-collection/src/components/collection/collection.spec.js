import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

import Collection from '../collection';
import styles from './collection.module.less';

describe('Collection [Component]', () => {
  let component;
  let changeSubTabSpy;
  const statsPlugin = () => { return (<div/>); };
  const statsStore = {};
  const localAppRegistry = new AppRegistry();
  const selectOrCreateTabSpy = sinon.spy();
  const sourceReadonly = false;

  beforeEach(() => {
    changeSubTabSpy = sinon.spy();
    component = mount(
      <Collection
        isReadonly={false}
        isTimeSeries={false}
        sourceName={null}
        tabs={[]}
        views={[]}
        queryHistoryIndexes={[]}
        globalAppRegistry={{}}
        statsPlugin={statsPlugin}
        statsStore={statsStore}
        scopedModals={[]}
        localAppRegistry={localAppRegistry}
        activeSubTab={0}
        changeActiveSubTab={changeSubTabSpy}
        id="collection"
        namespace="db.coll"
        selectOrCreateTab={selectOrCreateTabSpy}
        sourceReadonly={sourceReadonly} />
    );
  });

  afterEach(() => {
    component = null;
    changeSubTabSpy = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.collection}`)).to.be.present();
  });

  it('must not show the view-icon', () => {
    expect(
      component.find(`.${styles['collection-title-readonly-view-icon']}`)
    ).to.not.be.present();
  });

  it('must not include the collection name the view is based on', () => {
    expect(
      component.find(`.${styles['collection-title-readonly-view-on']}`)
    ).to.not.be.present();
  });
});
