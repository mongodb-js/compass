import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

import Collection from 'components/collection';
import styles from './collection.less';

describe('Collection [Component]', () => {
  let component;
  let changeSubTabSpy;
  const statsPlugin = () => { return (<div/>); };
  const statsStore = {};
  const localAppRegistry = new AppRegistry();

  beforeEach(() => {
    changeSubTabSpy = sinon.spy();
    component = mount(
      <Collection
        isReadonly={false}
        tabs={[]}
        views={[]}
        queryHistoryIndexes={[]}
        statsPlugin={statsPlugin}
        statsStore={statsStore}
        scopedModals={[]}
        localAppRegistry={localAppRegistry}
        activeSubTab={0}
        changeActiveSubTab={changeSubTabSpy}
        id="collection"
        namespace="db.coll" />
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
