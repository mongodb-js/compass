import React from 'react';
import { shallow } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

import CollectionStats from 'components/collection-stats';
import styles from './collection-stats.less';

describe('CollectionStats [Component]', () => {
  let component;

  beforeEach(() => {
    global.hadronApp = {
      appRegistry: new AppRegistry()
    };
    component = shallow(<CollectionStats />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['collection-stats']}`)).to.be.present();
  });
});
