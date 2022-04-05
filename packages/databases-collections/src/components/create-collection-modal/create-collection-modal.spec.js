import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import { Banner } from '@mongodb-js/compass-components';

import { CreateCollectionModal } from '../create-collection-modal';
import CollectionFields from '../collection-fields';

describe('CreateCollectionModal [Component]', () => {
  context('when the modal is visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let clearErrorSpy;

    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateCollectionModal
          isVisible
          isRunning={false}
          error={{message: 'A testing error occurred.'}}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find(ConfirmationModal)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.text()).to.include('Create Collection');
    });

    it('renders the modal form', () => {
      expect(component.find(CollectionFields)).to.be.present();
    });

    it('renders the error message', () => {
      expect(component.find(Banner)).to.be.present();
      expect(component.find(Banner)).to.have.length(1);
    });
  });

  context('when the modal is not visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let clearErrorSpy;

    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateCollectionModal
          isVisible={false}
          isRunning={false}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('does not display the form', () => {
      expect(component.find(CollectionFields)).to.not.be.present();
    });
  });
});
