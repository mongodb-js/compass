import React from 'react';
import { mount } from 'enzyme';

import Database from 'components/database';
import styles from './database.less';

class Collections extends React.Component {
  render() {
    return (<div id="test">Testing</div>);
  }
}

const ROLE = {
  name: 'Collections',
  component: Collections
};

describe('Database [Component]', () => {
  let component;

  beforeEach(() => {
    global.hadronApp.appRegistry.registerRole('Database.Tab', ROLE);
    component = mount(<Database />);
  });

  afterEach(() => {
    global.hadronApp.appRegistry.deregisterRole('Database.Tab', ROLE);
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.database}`)).to.be.present();
  });
});
