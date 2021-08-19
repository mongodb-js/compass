import React from 'react';
import { mount } from 'enzyme';
import { ConfirmationModal } from '@mongodb-js/compass-components';

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
    const saveFavorite = sinon.spy();
    const closeFavoriteModal = sinon.spy();
    let component;

    beforeEach(() => {
      component = mount(
        <FavoriteModal
          connectionModel={connection}
          saveFavorite={saveFavorite}
          closeFavoriteModal={closeFavoriteModal}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the favorite modal', () => {
      expect(component.find(ConfirmationModal)).to.be.present();
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
    const saveFavorite = sinon.spy();
    const closeFavoriteModal = sinon.spy();
    let component;

    beforeEach(() => {
      component = mount(
        <FavoriteModal
          connectionModel={connection}
          saveFavorite={saveFavorite}
          closeFavoriteModal={closeFavoriteModal}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('displays the favorite modal', () => {
      expect(component.find(ConfirmationModal)).to.be.present();
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
    const saveFavorite = sinon.spy();
    const closeFavoriteModal = sinon.spy();
    let component;

    beforeEach(() => {
      component = mount(
        <FavoriteModal
          connectionModel={connection}
          saveFavorite={saveFavorite}
          closeFavoriteModal={closeFavoriteModal}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('calls save favorite on save button click', () => {
      const saveButton = component.find('button').at(0);
      expect(saveButton.text()).to.be.eql('Save');
      saveButton.simulate('click');
      expect(saveFavorite.calledOnce).to.equal(true);
    });

    it('calls close favorite on cancel button click', () => {
      const cancelButton = component.find('button').at(1);
      expect(cancelButton.text()).to.be.eql('Cancel');
      cancelButton.simulate('click');
      expect(closeFavoriteModal.calledOnce).to.equal(true);
    });
  });
});
