import React from 'react';
import { mount } from 'enzyme';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import Banner from '@leafygreen-ui/banner';

import { CreateDatabaseModal } from '../create-database-modal';
import CollectionFields from '../collection-fields';
import styles from './create-database-modal.less';

describe('CreateDatabaseModal [Component]', () => {
  context('when the modal is visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let openLinkSpy;
    let createDatabaseSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      createDatabaseSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible
          isRunning={false}
          error={{message: 'A testing error occurred.'}}
          openLink={openLinkSpy}
          createDatabase={createDatabaseSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      createDatabaseSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find(ConfirmationModal)).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['create-database-modal']}`)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.text()).to.include('Create Database');
    });

    it('renders the modal form', () => {
      expect(component.find(CollectionFields)).to.be.present();
    });

    it('renders the error message and info message', () => {
      expect(component.find(Banner)).to.have.length(2);
    });
  });

  context('when a collection name has been entered', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CreateDatabaseModal
          isVisible
          isRunning={false}
          openLink={() => {}}
          createDatabase={() => {}}
          toggleIsVisible={() => {}}
          clearError={() => {}}
        />
      );

      component.setState({
        data: {
          collection: 'aa'
        }
      });

      component.update();
    });

    afterEach(() => {
      component = null;
    });

    it('does not render a message', () => {
      expect(component.find(Banner)).to.have.length(0);
    });
  });

  context('when the modal is not visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let openLinkSpy;
    let createDatabaseSpy;
    let clearErrorSpy;

    beforeEach(() => {
      openLinkSpy = sinon.spy();
      toggleIsVisibleSpy = sinon.spy();
      createDatabaseSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible={false}
          isRunning={false}
          openLink={openLinkSpy}
          createDatabase={createDatabaseSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
      openLinkSpy = null;
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      createDatabaseSpy = null;
      component = null;
    });

    it('does not display the form', () => {
      expect(component.find(CollectionFields)).to.not.be.present();
    });
  });
});
