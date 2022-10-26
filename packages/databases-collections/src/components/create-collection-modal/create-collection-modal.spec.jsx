import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { FormModal } from '@mongodb-js/compass-components';
import { Banner } from '@mongodb-js/compass-components';

import { CreateCollectionModal } from '../create-collection-modal';
import CollectionFields from '../collection-fields';

describe('CreateCollectionModal [Component]', function() {
  context('when the modal is visible', function() {
    let component;
    let toggleIsVisibleSpy;
    let clearErrorSpy;

    beforeEach(function() {
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

    afterEach(function() {
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('displays the modal', function() {
      expect(component.find(FormModal)).to.be.present();
    });

    it('renders the header text', function() {
      expect(component.text()).to.include('Create Collection');
    });

    it('renders the modal form', function() {
      expect(component.find(CollectionFields)).to.be.present();
    });

    it('renders the error message', function() {
      expect(component.find(Banner)).to.be.present();
      expect(component.find(Banner)).to.have.length(1);
    });
  });

  context('when the modal is not visible', function() {
    let component;
    let toggleIsVisibleSpy;
    let clearErrorSpy;

    beforeEach(function() {
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

    afterEach(function() {
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('does not display the form', function() {
      expect(component.find(CollectionFields)).to.not.be.present();
    });
  });
});
