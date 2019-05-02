/* eslint react/no-multi-comp: 0 */
import React from 'react';
import { mount } from 'enzyme';
import Reflux from 'reflux';

import Collection from 'components/collection';
import styles from './collection.less';

class Documents extends React.Component {
  render() {
    return <div id="test">Testing</div>;
  }
}

class CollectionStats extends React.Component {
  render() {
    return <div id="stats">Stats</div>;
  }
}

const ROLE = {
  name: 'Documents',
  component: Documents
};

const CollectionStore = Reflux.createStore({
  setTabs() {},
  getActiveTab() {
    return 0;
  },
  ns() {
    return 'echo.albums';
  },
  isReadonly() {
    return true;
  },
  type() {
    return 'view';
  },
  viewOn() {
    return 'bands';
  },
  pipeline() {
    return [
      { $unwind: '$albums' },
      { $project: { artist: '$name', title: '$albums.name' } }
    ];
  }
});

describe('Collection [Component]', () => {
  const instance = {
    build: {
      version: '4.0.0'
    }
  };
  let component;

  beforeEach(() => {
    global.hadronApp.appRegistry.registerComponent(
      'CollectionStats.Component',
      CollectionStats
    );
    global.hadronApp.appRegistry.registerStore(
      'App.CollectionStore',
      CollectionStore
    );
    global.hadronApp.appRegistry.registerRole('Collection.Tab', ROLE);
    global.hadronApp.instance = instance;
    component = mount(<Collection namespace="echo.albums" />);
  });

  afterEach(() => {
    global.hadronApp.appRegistry.deregisterRole('Collection.Tab', ROLE);
    global.hadronApp.appRegistry.deregisterStore('App.CollectionStore');
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.collection}`)).to.be.present();
  });

  it('must show the view-icon', () => {
    console.log(styles['collection-title-readonly-view-icon']);
    expect(
      component.find(`.${styles['collection-title-readonly-view-icon']}`)
    ).to.be.present();
  });

  it('must include the collection name the view is based on', () => {
    expect(
      component.find(`.${styles['collection-title-readonly-view-on']}`)
    ).to.include.text('(on: bands)');
  });
});
