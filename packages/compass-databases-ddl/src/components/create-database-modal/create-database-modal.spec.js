import React from 'react';
import { mount } from 'enzyme';
import { CreateDatabaseModal } from '../create-database-modal';
import styles from './create-database-modal.less';

describe('CreateDatabaseModal [Component]', () => {
  context('when the modal is visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let openLinkSpy;
    let changeCappedSizeSpy;
    let changeCollectionNameSpy;
    let changeDatabaseNameSpy;
    let changeCollationOptionSpy;
    let createDatabaseSpy;
    let toggleIsCappedSpy;
    let toggleIsCustomCollationSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      createDatabaseSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible
          isCapped={false}
          isCustomCollation={false}
          isRunning={false}
          error={{message: 'A testing error occurred.'}}
          name="dbName"
          collectionName="collName"
          cappedSize={''}
          collation={{}}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollectionName={changeCollectionNameSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeDatabaseName={changeDatabaseNameSpy}
          createDatabase={createDatabaseSpy}
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
      changeCollectionNameSpy = null;
      changeCollationOptionSpy = null;
      changeDatabaseNameSpy = null;
      createDatabaseSpy = null;
      toggleIsCappedSpy = null;
      toggleIsCustomCollationSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find('.modal')).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['create-database-modal']}`)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.find('.modal-title')).to.have.text('Create Database');
    });

    it('renders the cancel button', () => {
      expect(component.find('.btn-default').hostNodes()).to.have.text('Cancel');
    });

    it('renders the create button enabled', () => {
      expect(component.find('.btn-primary').hostNodes()).to.have.text('Create Database');
      expect(component.find('.btn-primary').hostNodes()).to.not.have.attr('disabled');
    });

    it('renders the modal form', () => {
      expect(component.find('[name="create-database-modal-form"]')).to.be.present();
    });

    it('renders the info message', () => {
      expect(component.find(`.${styles['create-database-modal-notice']}`)).to.be.present();
    });

    it('renders the error message', () => {
      expect(component.find('.modal-status-error-message')).to.be.present();
    });

    context('when changing the database name', () => {
      it('calls the change database name function', () => {
        component.find('#create-database-name').hostNodes().
          simulate('change', 'dbName');
        expect(changeDatabaseNameSpy.calledWith('dbName')).to.equal(true);
      });

      context('setting it to an empty value', () => {
        beforeEach(() => {
          component.setProps({
            name: ''
          });
        });

        it('disables the create button', () => {
          expect(component.find('.btn-primary').hostNodes()).to.have.attr('disabled');
        });
      });
    });

    context('when changing the collection name', () => {
      it('calls the change collection name function', () => {
        component.find('#create-database-collection-name').hostNodes().
          simulate('change', 'collName');
        expect(changeCollectionNameSpy.calledWith('collName')).to.equal(true);
      });

      context('setting it to an empty value', () => {
        beforeEach(() => {
          component.setProps({
            collectionName: ''
          });
        });

        it('disables the create button', () => {
          expect(component.find('.btn-primary').hostNodes()).to.have.attr('disabled');
        });
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
        component.find('[data-test-id="cancel-create-database-button"]').hostNodes().simulate('click');
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
    let changeCollectionNameSpy;
    let changeCollationOptionSpy;
    let changeDatabaseNameSpy;
    let createDatabaseSpy;
    let toggleIsCappedSpy;
    let toggleIsCustomCollationSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      createDatabaseSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible={false}
          isCapped={false}
          isCustomCollation={false}
          isRunning={false}
          name="dbName"
          collectionName="collName"
          cappedSize={''}
          collation={{}}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollectionName={changeCollectionNameSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeDatabaseName={changeDatabaseNameSpy}
          createDatabase={createDatabaseSpy}
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
      changeCollectionNameSpy = null;
      changeCollationOptionSpy = null;
      changeDatabaseNameSpy = null;
      createDatabaseSpy = null;
      toggleIsCappedSpy = null;
      toggleIsCustomCollationSpy = null;
      component = null;
    });

    it('does not display the modal', () => {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
});
