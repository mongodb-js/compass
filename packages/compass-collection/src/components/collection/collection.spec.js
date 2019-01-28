/* eslint react/no-multi-comp: 0 */
import React from 'react';
import { mount } from 'enzyme';
import Reflux from 'reflux';

import Collection from 'components/collection';
import styles from './collection.less';

class Documents extends React.Component {
  render() {
    return (<div id="test">Testing</div>);
  }
}

class CollectionStats extends React.Component {
  render() {
    return (<div id="stats">Stats</div>);
  }
}

const ROLE = {
  name: 'Documents',
  component: Documents
};

const CollectionStore = Reflux.createStore({
  setTabs() {

  },
  getActiveTab() {
    return 0;
  },
  isReadonly() {
    return false;
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
    global.hadronApp.appRegistry.registerComponent('CollectionStats.Component', CollectionStats);
    global.hadronApp.appRegistry.registerStore('App.CollectionStore', CollectionStore);
    global.hadronApp.appRegistry.registerRole('Collection.Tab', ROLE);
    global.hadronApp.instance = instance;
    component = mount(<Collection namespace="db.coll" />);
  });

  afterEach(() => {
    global.hadronApp.appRegistry.deregisterRole('Collection.Tab', ROLE);
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.collection}`)).to.be.present();
  });
});
