import React from 'react';
import { shallow } from 'enzyme';
import FavoriteButton from './favorite-button';

import styles from './favorite-button.module.less';

describe('FavoriteButton [Component]', () => {
  context('when it is a new connection', () => {
    const connectionModel = {
      connection: {
        authStrategy: 'MONGODB',
        isSrvRecord: false,
        readPreference: 'primaryPreferred',
        attributes: { hostanme: 'localhost' },
        isFavorite: false
      }
    };
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteButton
          toggleIsModalVisible={()=>{}}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the the default pill', () => {
      expect(component.find(`.${styles['favorite-button']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-button-text']}`)).to.be.present();
      expect(component.find('FontAwesome[name="star-o"]')).to.be.present();
    });
  });

  context('when it is a saved with no color', () => {
    const connectionModel = {
      connection: {
        authStrategy: 'MONGODB',
        isSrvRecord: false,
        readPreference: 'primaryPreferred',
        attributes: { hostanme: 'localhost' },
        isFavorite: true
      }
    };
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteButton
          toggleIsModalVisible={()=>{}}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the the filled with no color pill', () => {
      expect(component.find(`.${styles['favorite-button']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-button-text']}`)).to.be.present();
      expect(component.find('FontAwesome[name="star"]')).to.be.present();
    });
  });
});
