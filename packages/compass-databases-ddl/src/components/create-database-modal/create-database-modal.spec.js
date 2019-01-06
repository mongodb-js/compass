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

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      hideCreateDatabaseSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible
          isCapped={false}
          name="dbName"
          collectionName="collName"
          cappedSize={null}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollectionName={changeCollectionNameSpy}
          changeDatabaseName={changeDatabaseNameSpy}
          toggleIsCapped={toggleIsCappedSpy}
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

    context('when clicking cancel', () => {

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

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      hideCreateDatabaseSpy = sinon.spy();
      changeCappedSizeSpy = sinon.spy();
      changeCollectionNameSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      toggleIsCappedSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible={false}
          isCapped={false}
          name="dbName"
          collectionName="collName"
          cappedSize={null}
          openLink={openLinkSpy}
          changeCappedSize={changeCappedSizeSpy}
          changeCollectionName={changeCollectionNameSpy}
          changeDatabaseName={changeDatabaseNameSpy}
          toggleIsCapped={toggleIsCappedSpy}
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
      component = null;
    });

    it('does not display the modal', () => {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
});
