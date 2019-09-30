import React from 'react';
import { shallow } from 'enzyme';
import FavoriteModal from './favorite-modal';

describe('FavoriteModal [Component]', () => {
  context('when it is a new connection', () => {
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      isFavorite: false
    };
    const isModalVisible = true;
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteModal
          currentConnection={connection}
          isModalVisible={isModalVisible} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the favorite modal', () => {
      expect(component.find('Modal')).to.be.present();
      expect(component.find('ModalInputComponent')).to.be.present();
      expect(component.find('TextButton[dataTestId="cancel-favorite-button"]')).to.be.present();
      expect(component.find('TextButton[dataTestId="create-favorite-button"]')).to.be.present();
      expect(component.find('TextButton[dataTestId="delete-favorite-button"]')).to.be.not.present();
    });
  });

  context('when it is a saved to favorites connection', () => {
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      isFavorite: true
    };
    const isModalVisible = true;
    let component;

    beforeEach(() => {
      component = shallow(
        <FavoriteModal
          currentConnection={connection}
          isModalVisible={isModalVisible} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the favorite modal', () => {
      expect(component.find('Modal')).to.be.present();
      expect(component.find('ModalInputComponent')).to.be.present();
      expect(component.find('TextButton[dataTestId="cancel-favorite-button"]')).to.be.present();
      expect(component.find('TextButton[dataTestId="create-favorite-button"]')).to.be.present();
      expect(component.find('TextButton[dataTestId="delete-favorite-button"]')).to.be.present();
    });
  });
});
