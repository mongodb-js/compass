import React from 'react';
import { mount } from 'enzyme';
import { CreateCollectionModal } from 'components/create-collection-modal';
import styles from './create-collection-modal.less';

describe('CreateCollectionModal [Component]', () => {
  context('when the modal is visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let openLinkSpy;
    let changeCappedSizeSpy;
    let changeCollectionNameSpy;
    let changeCollationOptionSpy;
    let createCollectionSpy;
    let toggleIsCappedSpy;
    let toggleIsCustomCollationSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      createCollectionSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateCollectionModal
          isVisible
          isCapped={false}
          isCustomCollation={false}
          isRunning={false}
          error={{message: 'A testing error occurred.'}}
          name="collName"
          cappedSize={''}
          collation={{}}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeCollectionName={changeCollectionNameSpy}
          createCollection={createCollectionSpy}
          toggleIsCapped={toggleIsCappedSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy} />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      changeCappedSizeSpy = null;
      changeCollationOptionSpy = null;
      changeCollectionNameSpy = null;
      createCollectionSpy = null;
      toggleIsCappedSpy = null;
      toggleIsCustomCollationSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find('.modal')).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['create-collection-modal']}`)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.find('.modal-title')).to.have.text('Create Collection');
    });

    it('renders the cancel button', () => {
      expect(component.find('.btn-default').hostNodes()).to.have.text('Cancel');
    });

    it('renders the create button', () => {
      expect(component.find('.btn-primary').hostNodes()).to.have.text('Create Collection');
    });

    it('renders the modal form', () => {
      expect(component.find('[name="create-collection-modal-form"]')).to.be.present();
    });

    it('renders the error message', () => {
      expect(component.find('.modal-status-error-message')).to.be.present();
    });

    context('when changing the collection name', () => {
      it('calls the change collection name function', () => {
        component.find('#create-collection-name').hostNodes().
          simulate('change', 'collName');
        expect(changeCollectionNameSpy.calledWith('collName')).to.equal(true);
      });
    });

    context('when changing is capped', () => {
      context('when changing capped size', () => {
      });
    });

    context('when changing is custom collation', () => {

    });

    context('when clicking cancel', () => {
      it('closes the modal', () => {
        component.find('[data-test-id="cancel-create-collection-button"]').hostNodes().simulate('click');
        expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
      });
    });

    context('when clicking create', () => {
    });

    context('when clicking the close button of the error message', () => {
      it('clears the error message', () => {
        component.find('.modal-status-error-icon').simulate('click');
        expect(clearErrorSpy.calledOnce).to.equal(true);
      });
    });
  });

  context('when the modal is not visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let openLinkSpy;
    let changeCappedSizeSpy;
    let changeCollationOptionSpy;
    let changeCollectionNameSpy;
    let createCollectionSpy;
    let toggleIsCappedSpy;
    let toggleIsCustomCollationSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      createCollectionSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateCollectionModal
          isVisible={false}
          isCapped={false}
          isCustomCollation={false}
          isRunning={false}
          name="collName"
          cappedSize={''}
          collation={{}}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeCollectionName={changeCollectionNameSpy}
          createCollection={createCollectionSpy}
          toggleIsCapped={toggleIsCappedSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy} />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      changeCappedSizeSpy = null;
      changeCollationOptionSpy = null;
      changeCollectionNameSpy = null;
      createCollectionSpy = null;
      toggleIsCappedSpy = null;
      toggleIsCustomCollationSpy = null;
      component = null;
    });

    it('does not display the modal', () => {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
});
