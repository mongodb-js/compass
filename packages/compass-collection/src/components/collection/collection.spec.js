import React from 'react';
import { mount } from 'enzyme';

import Collection from 'components/collection';
import styles from './collection.less';

class Collections extends React.Component {
  render() {
    return (<div id="test">Testing</div>);
  }
}

const ROLE = {
  name: 'Collections',
  component: Collections
};

describe('Collection [Component]', () => {
  let component;

  beforeEach(() => {
    global.hadronApp.appRegistry.registerRole('Collection.Tab', ROLE);
    component = mount(<Collection />);
  });

  afterEach(() => {
    global.hadronApp.appRegistry.deregisterRole('Collection.Tab', ROLE);
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.collection}`)).to.be.present();
  });
});
