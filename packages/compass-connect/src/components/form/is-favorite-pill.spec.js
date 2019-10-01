import React from 'react';
import { shallow } from 'enzyme';
import IsFavoritePill from './is-favorite-pill';

import styles from '../connect.less';

describe('IsFavoritePill [Component]', () => {
  context('when it is a new connection', () => {
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      isFavorite: false
    };
    const isModalVisible = false;
    const isMessageVisible = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <IsFavoritePill
          currentConnection={connection}
          isModalVisible={isModalVisible}
          isMessageVisible={isMessageVisible} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the the default pill', () => {
      expect(component.find(`.${styles['is-favorite-pill-text']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-saved']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-saved-visible']}`)).to.be.not.present();
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
    const isModalVisible = false;
    const isMessageVisible = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <IsFavoritePill
          currentConnection={connection}
          isModalVisible={isModalVisible}
          isMessageVisible={isMessageVisible} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the the default pill', () => {
      expect(component.find(`.${styles['is-favorite-pill-text']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-saved']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-saved-visible']}`)).to.be.not.present();
    });
  });
});
