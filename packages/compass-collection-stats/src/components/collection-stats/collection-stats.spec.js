import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

import CollectionStats from 'components/collection-stats';
import styles from './collection-stats.less';

describe('CollectionStats [Component]', () => {
  let component;

  beforeEach(() => {
    global.hadronApp = {
      appRegistry: new AppRegistry()
    };
    component = mount(<CollectionStats />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['collection-stats']}`)).to.be.present();
  });

  describe('When the collection is a view', () => {
    let _component;
    before(() => {
      _component = mount(<CollectionStats isReadonly />);
    });

    it('should hide the stats', () => {
      expect(
        _component.find(`.${styles['collection-stats']}`)
      ).to.not.be.present();
    });

    after(() => {
      _component = null;
    });
  });
});
