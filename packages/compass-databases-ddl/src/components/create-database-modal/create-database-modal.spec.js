import React from 'react';
import { mount } from 'enzyme';
import { CreateDatabaseModal } from 'components/create-database-modal';
import styles from './create-database-modal.less';

describe('CreateDatabaseModal [Component]', () => {
  context('when the modal is visible', () => {
    let component;
    let hideCreateDatabaseSpy;
    let openLinkSpy;
    let changeCappedSizeSpy;
    let changeCollectionNameSpy;
    let changeDatabaseNameSpy;
    let toggleIsCappedSpy;
    let toggleIsCustomCollationSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      hideCreateDatabaseSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible
          isCapped={false}
          isCustomCollation={false}
          name="dbName"
          collectionName="collName"
          cappedSize={null}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollectionName={changeCollectionNameSpy}
          changeDatabaseName={changeDatabaseNameSpy}
          toggleIsCapped={toggleIsCappedSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          hideCreateDatabase={hideCreateDatabaseSpy} />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      hideCreateDatabaseSpy = null;
      changeCappedSizeSpy = null;
      changeCollectionNameSpy = null;
      changeDatabaseNameSpy = null;
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

    it('renders the create button', () => {
      expect(component.find('.btn-primary').hostNodes()).to.have.text('Create Database');
    });

    it('renders the modal form', () => {
      expect(component.find('[name="create-database-modal-form"]')).to.be.present();
    });

    it('renders the info message', () => {
      expect(component.find(`.${styles['create-database-modal-notice']}`)).to.be.present();
    });

    context('when changing the database name', () => {
      it('calls the change database name function', () => {
        component.find('#create-database-name').hostNodes().
          simulate('change', 'dbName');
        expect(changeDatabaseNameSpy.calledWith('dbName')).to.equal(true);
      });
    });

    context('when changing the collection name', () => {
      it('calls the change collection name function', () => {
        component.find('#create-database-collection-name').hostNodes().
          simulate('change', 'collName');
        expect(changeCollectionNameSpy.calledWith('collName')).to.equal(true);
      });
    });

    context('when changing is capped', () => {
    });

    context('when changing capped size', () => {
    });

    context('when clicking cancel', () => {
      it('closes the modal', () => {
        component.find('[data-test-id="cancel-create-database-button"]').hostNodes().simulate('click');
        expect(hideCreateDatabaseSpy.calledOnce).to.equal(true);
      });
    });

    context('when clicking create', () => {
    });
  });

  context('when the modal is not visible', () => {
    let component;
    let hideCreateDatabaseSpy;
    let openLinkSpy;
    let changeCappedSizeSpy;
    let changeCollectionNameSpy;
    let changeDatabaseNameSpy;
    let toggleIsCappedSpy;
    let toggleIsCustomCollationSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      hideCreateDatabaseSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible={false}
          isCapped={false}
          isCustomCollation={false}
          name="dbName"
          collectionName="collName"
          cappedSize={null}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollectionName={changeCollectionNameSpy}
          changeDatabaseName={changeDatabaseNameSpy}
          toggleIsCapped={toggleIsCappedSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          hideCreateDatabase={hideCreateDatabaseSpy} />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      hideCreateDatabaseSpy = null;
      changeCappedSizeSpy = null;
      changeCollectionNameSpy = null;
      changeDatabaseNameSpy = null;
      toggleIsCappedSpy = null;
      toggleIsCustomCollationSpy = null;
      component = null;
    });

    it('does not display the modal', () => {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
});
