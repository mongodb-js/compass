import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import { Banner } from '@mongodb-js/compass-components';

import { CreateDatabaseModal } from '../create-database-modal';
import CollectionFields from '../collection-fields';

describe('CreateDatabaseModal [Component]', function () {
  context('when the modal is visible', function () {
    let component;
    let toggleIsVisibleSpy;
    let createDatabaseSpy;
    let clearErrorSpy;

    beforeEach(function () {
      toggleIsVisibleSpy = sinon.spy();
      createDatabaseSpy = sinon.spy();
      clearErrorSpy = sinon.spy();

      component = mount(
        <CreateDatabaseModal
          isVisible
          isRunning={false}
          error={{ message: 'A testing error occurred.' }}
          createDatabase={createDatabaseSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          clearError={clearErrorSpy}
        />
      );
    });

    afterEach(function () {
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      createDatabaseSpy = null;
      component = null;
    });

    it('displays the modal', function () {
      expect(component.find(ConfirmationModal)).to.be.present();
    });

    it('renders the header text', function () {
      expect(component.text()).to.include('Create Database');
    });

    it('renders the modal form', function () {
      expect(component.find(CollectionFields)).to.be.present();
    });

    it('renders the error message and info message', function () {
      expect(component.find(Banner)).to.have.length(2);
    });
  });

  context('when a collection name has been entered', function () {
    let component;

    beforeEach(function () {
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
          collection: 'aa',
        },
      });

      component.update();
    });

    afterEach(function () {
      component = null;
    });

    it('does not render a message', function () {
      expect(component.find(Banner)).to.have.length(0);
    });
  });

  context('when the modal is not visible', function () {
    let component;
    let toggleIsVisibleSpy;
    let createDatabaseSpy;
    let clearErrorSpy;

    beforeEach(function () {
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

    afterEach(function () {
      clearErrorSpy = null;
      toggleIsVisibleSpy = null;
      createDatabaseSpy = null;
      component = null;
    });

    it('does not display the form', function () {
      expect(component.find(CollectionFields)).to.not.be.present();
    });
  });
});
