import React from 'react';
import { mount } from 'enzyme';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import { expect } from 'chai';
import sinon from 'sinon';

import { DropIndexModal } from '../drop-index-modal';

describe('DropIndexModal [Component]', function () {
  let component;
  let toggleIsVisibleSpy;
  let toggleInProgressSpy;
  let changeConfirmNameSpy;
  let resetFormSpy;
  let dropIndexSpy;

  beforeEach(function () {
    toggleIsVisibleSpy = sinon.spy();
    toggleInProgressSpy = sinon.spy();
    changeConfirmNameSpy = sinon.spy();
    resetFormSpy = sinon.spy();
    dropIndexSpy = sinon.spy();
  });

  afterEach(function () {
    toggleIsVisibleSpy = null;
    toggleInProgressSpy = null;
    changeConfirmNameSpy = null;
    resetFormSpy = null;
    dropIndexSpy = null;
    component.unmount();
    component = null;
  });

  context('when the modal is visible and names do not match', function () {
    beforeEach(function () {
      component = mount(
        <DropIndexModal
          isVisible
          inProgress={false}
          name="test name"
          confirmName=""
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    it('displays the modal', function () {
      expect(component.find(ConfirmationModal)).to.be.present();
    });

    it('renders the header text', function () {
      expect(component.find('h1')).to.have.text('Drop Index');
    });

    it('renders the modal form', function () {
      expect(
        component.find('[data-test-id="confirm-drop-index-name"]')
      ).to.be.present();
    });

    context('when changing the confirm index name', function () {
      it('calls the change confirm index name function', function () {
        component
          .find('[data-test-id="confirm-drop-index-name"]')
          .hostNodes()
          .simulate('change', { target: { value: 'iName' } });
        expect(changeConfirmNameSpy.calledWith('iName')).to.equal(true);
      });
    });
    context('when clicking cancel', function () {
      it('closes the modal', function () {
        component.find('button').at(1).hostNodes().simulate('click');
        expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
        expect(resetFormSpy.called).to.equal(true);
      });
    });
    context('when clicking drop', function () {
      it('does not drop the index', function () {
        component.find('button').at(0).hostNodes().simulate('click');
        expect(dropIndexSpy.called).to.equal(false);
      });
    });
  });

  context('when the modal is visible and names match', function () {
    beforeEach(function () {
      component = mount(
        <DropIndexModal
          isVisible
          inProgress={false}
          name="test name"
          confirmName="test name"
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    context('when clicking drop', function () {
      it('drops the index', function () {
        component.find('button').at(0).hostNodes().simulate('click');
        expect(dropIndexSpy.called).to.equal(true);
        // expect(dropIndexSpy.args[0][0]).to.equal('test name');
      });
    });
  });

  context('when the modal is visible and in progress', function () {
    beforeEach(function () {
      component = mount(
        <DropIndexModal
          isVisible
          inProgress
          name="test name"
          confirmName=""
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    it('displays in progress message', function () {
      expect(component.find('[data-test-id="modal-message"]').text()).to.equal(
        'Drop in Progress'
      );
    });
  });
  context('when the modal is visible and error', function () {
    beforeEach(function () {
      component = mount(
        <DropIndexModal
          isVisible
          inProgress={false}
          error="test error"
          name="test name"
          confirmName=""
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    it('displays the error message', function () {
      expect(component.find('[data-test-id="modal-message"]').text()).to.equal(
        'test error'
      );
    });
  });
  context('when the modal is not visible', function () {
    beforeEach(function () {
      component = mount(
        <div name="tester">
          <DropIndexModal
            isVisible={false}
            inProgress={false}
            name="test name"
            confirmName=""
            toggleIsVisible={toggleIsVisibleSpy}
            toggleInProgress={toggleInProgressSpy}
            changeConfirmName={changeConfirmNameSpy}
            resetForm={resetFormSpy}
            dropIndex={dropIndexSpy}
          />
        </div>
      );
    });

    it('does not display the form', function () {
      expect(component.find('form')).to.not.be.present();
    });
  });
});
