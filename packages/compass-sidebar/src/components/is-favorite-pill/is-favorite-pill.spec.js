import React from 'react';
import { shallow } from 'enzyme';
import IsFavoritePill from './is-favorite-pill';

import styles from './is-favorite-pill.less';

describe('IsFavoritePill [Component]', () => {
  context('when it is a new connection', () => {
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      isFavorite: false
    };
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <IsFavoritePill
          toggleIsModalVisible={()=>{}}
          connection={connection}
          isSidebarCollapsed={isSidebarCollapsed} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the the default pill', () => {
      expect(component.find(`.${styles['is-favorite-pill']}`)).to.be.present();
      expect(component.find(`.${styles['is-favorite-pill-text']}`)).to.be.present();
      expect(component.find('FontAwesome[name="star-o"]')).to.be.present();
    });
  });

  context('when it is a saved with no color', () => {
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      isFavorite: true
    };
    let component;

    beforeEach(() => {
      component = shallow(
        <IsFavoritePill toggleIsModalVisible={()=>{}} connection={connection} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the the filled with no color pill', () => {
      expect(component.find(`.${styles['is-favorite-pill']}`)).to.be.present();
      expect(component.find(`.${styles['is-favorite-pill-text']}`)).to.be.present();
      expect(component.find('FontAwesome[name="star"]')).to.be.present();
    });
  });
});
