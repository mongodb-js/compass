import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import FavoriteButton from './favorite-button';

import styles from './favorite-button.module.less';

describe('FavoriteButton [Component]', () => {
  context('when it is a new connection', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <FavoriteButton
          toggleIsFavoriteModalVisible={()=>{}}
          favoriteOptions={undefined}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the the default button without star filled in', () => {
      expect(component.find(`.${styles['favorite-button']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-button-text']}`)).to.be.present();
      let starStyle = component.find('#favoriteIconStar').get(0).props;
      expect(starStyle).to.have.property('fill', 'none');
    });
  });

  context('when it is a saved with no color', () => {
    let component;

    beforeEach(() => {
      component = mount(
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

    it('displays the the filled in star', () => {
      expect(component.find(`.${styles['favorite-button']}`)).to.be.present();
      expect(component.find(`.${styles['favorite-button-text']}`)).to.be.present();

      let starStyle = component.find('#favoriteIconStar').get(0).props;
      expect(starStyle).to.have.property('fill', '#ffffff');
    });
  });
});
