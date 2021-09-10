import React from 'react';
import { shallow } from 'enzyme';
import IsFavoritePill from './is-favorite-pill';

import styles from './is-favorite-pill.module.less';

describe('IsFavoritePill [Component]', () => {
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
        <IsFavoritePill
          toggleIsModalVisible={()=>{}}
          connectionModel={connectionModel}
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
        <IsFavoritePill
          toggleIsModalVisible={()=>{}}
          connectionModel={connectionModel}
          isSidebarCollapsed={isSidebarCollapsed} />
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
