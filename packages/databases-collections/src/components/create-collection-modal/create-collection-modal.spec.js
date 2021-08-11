import React from 'react';
import { mount } from 'enzyme';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import Banner from '@leafygreen-ui/banner';

import { CreateCollectionModal } from '../create-collection-modal';
import CollectionFields from '../collection-fields';
import styles from './create-collection-modal.less';

describe('CreateCollectionModal [Component]', () => {
  context('when the modal is visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let openLinkSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateCollectionModal
          isVisible
          isRunning={false}
          error={{message: 'A testing error occurred.'}}
          openLink={openLinkSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find(ConfirmationModal)).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['create-collection-modal']}`)).to.be.present();
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
    let openLinkSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateCollectionModal
          isVisible={false}
          isRunning={false}
          openLink={openLinkSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('does not display the form', () => {
      expect(component.find(CollectionFields)).to.not.be.present();
    });
  });
});
