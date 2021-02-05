import React from 'react';
import { mount } from 'enzyme';

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
    const deleteFavorite = sinon.spy();
    const saveFavorite = sinon.spy();
    const closeFavoriteModal = sinon.spy();
    let component;

    beforeEach(() => {
      component = mount(
        <FavoriteModal
          connectionModel={connection}
          deleteFavorite={deleteFavorite}
          saveFavorite={saveFavorite}
          closeFavoriteModal={closeFavoriteModal} />
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
    const deleteFavorite = sinon.spy();
    const saveFavorite = sinon.spy();
    const closeFavoriteModal = sinon.spy();
    let component;

    beforeEach(() => {
      component = mount(
        <FavoriteModal
          connectionModel={connection}
          deleteFavorite={deleteFavorite}
          saveFavorite={saveFavorite}
          closeFavoriteModal={closeFavoriteModal} />
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

  context('when modal is displayed', () => {
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      isFavorite: true
    };
    const deleteFavorite = sinon.spy();
    const saveFavorite = sinon.spy();
    const closeFavoriteModal = sinon.spy();
    let component;

    beforeEach(() => {
      component = mount(
        <FavoriteModal
          connectionModel={connection}
          deleteFavorite={deleteFavorite}
          saveFavorite={saveFavorite}
          closeFavoriteModal={closeFavoriteModal} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('calls save favorite on save button click', () => {
      component.find('TextButton[dataTestId="create-favorite-button"]').simulate('click');
      expect(saveFavorite.calledOnce).to.equal(true);
    });

    it('calls delete favorite on delete button click', () => {
      component.find('TextButton[dataTestId="delete-favorite-button"]').simulate('click');
      expect(deleteFavorite.calledOnce).to.equal(true);
    });

    it('calls close favorite on cancel button click', () => {
      component.find('TextButton[dataTestId="cancel-favorite-button"]').simulate('click');
      expect(closeFavoriteModal.calledOnce).to.equal(true);
    });
  });
});
