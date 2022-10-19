import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { FormModal } from '@mongodb-js/compass-components';
import { Banner } from '@mongodb-js/compass-components';

import { CreateDatabaseModal } from '../create-database-modal';
import CollectionFields from '../collection-fields';

describe('CreateDatabaseModal [Component]', () => {
  context('when the modal is visible', () => {
    let component;
    let toggleIsVisibleSpy;
    let createDatabaseSpy;
    let clearErrorSpy;

    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      createDatabaseSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible
          isRunning={false}
          error={{message: 'A testing error occurred.'}}
          createDatabase={createDatabaseSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      createDatabaseSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find(FormModal)).to.be.present();
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
    let createDatabaseSpy;
    let clearErrorSpy;

    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      createDatabaseSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible={false}
          isRunning={false}
          createDatabase={createDatabaseSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(() => {
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
