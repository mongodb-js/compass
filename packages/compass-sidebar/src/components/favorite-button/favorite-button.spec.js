import React from 'react';
import { shallow } from 'enzyme';
import FavoriteButton from './favorite-button';

import styles from './favorite-button.module.less';

describe('FavoriteButton [Component]', () => {
  context('when it is a new connection', () => {
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteButton
          toggleIsFavoriteModalVisible={()=>{}}
          favoriteOptions={undefined}
        />
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
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteButton
          toggleIsFavoriteModalVisible={()=>{}}
          favoriteOptions={{
            name: '123',
            color: undefined
          }}
        />
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
