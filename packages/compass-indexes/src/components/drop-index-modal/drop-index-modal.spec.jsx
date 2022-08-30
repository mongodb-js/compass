import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  render,
  screen,
  cleanup,
  fireEvent,
  within,
} from '@testing-library/react';

import { DropIndexModal } from '../drop-index-modal';

describe('DropIndexForm [Component]', function () {
  let toggleIsVisibleSpy;
  let toggleInProgressSpy;
  let changeConfirmNameSpy;
  let resetFormSpy;
  let dropIndexSpy;
  let clearErrorSpy;

  beforeEach(function () {
    toggleIsVisibleSpy = sinon.spy();
    toggleInProgressSpy = sinon.spy();
    changeConfirmNameSpy = sinon.spy();
    resetFormSpy = sinon.spy();
    dropIndexSpy = sinon.spy();
    clearErrorSpy = sinon.spy();
  });

  afterEach(function () {
    toggleIsVisibleSpy = null;
    toggleInProgressSpy = null;
    changeConfirmNameSpy = null;
    resetFormSpy = null;
    dropIndexSpy = null;
    clearErrorSpy = null;
    cleanup();
  });

  context('when names do not match', function () {
    beforeEach(function () {
      render(
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
          clearError={clearErrorSpy}
        />
      );
    });

    it('displays the modal', function () {
      const confirmationModal = screen.getByTestId('drop-index-modal');
      expect(confirmationModal).to.exist;
    });

    it('renders the header text', function () {
      const confirmationModal = screen.getByTestId('drop-index-modal');
      const header = within(confirmationModal).getByText('Drop Index');
      expect(header).to.exist;
    });

    it('renders the modal form', function () {
      const confirmationModalForm = screen.getByTestId(
        'confirm-drop-index-name'
      );
      expect(confirmationModalForm).to.exist;
    });

    context('when changing the confirm index name', function () {
      it('calls the change confirm index name function', function () {
        const confirmDropIndexName = screen.getByTestId(
          'confirm-drop-index-name'
        );
        fireEvent.change(confirmDropIndexName, { target: { value: 'iName' } });
        expect(changeConfirmNameSpy.calledWith('iName')).to.equal(true);
      });
    });

    context('when clicking cancel', function () {
      it('closes the modal', function () {
        const confirmationModal = screen.getByTestId('drop-index-modal');
        const button = within(confirmationModal).getByText('Cancel');
        expect(button).to.exist;
        fireEvent.click(button);
        expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
        expect(resetFormSpy.called).to.equal(true);
      });
    });

    context('when clicking drop', function () {
      it('does not drop the index', function () {
        const confirmationModal = screen.getByTestId('drop-index-modal');
        const button = within(confirmationModal).getByText('Drop');
        expect(button).to.exist;
        fireEvent.click(button);
        expect(dropIndexSpy.called).to.equal(false);
      });
    });
  });

  context('when names match', function () {
    beforeEach(function () {
      render(
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
          clearError={clearErrorSpy}
        />
      );
    });

    context('when clicking drop', function () {
      it('drops the index', function () {
        const confirmationModal = screen.getByTestId('drop-index-modal');
        const button = within(confirmationModal).getByText('Drop');
        expect(button).to.exist;
        fireEvent.click(button);
        expect(dropIndexSpy.called).to.equal(true);
      });
    });
  });

  context('when in progress', function () {
    beforeEach(function () {
      render(
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
          clearError={clearErrorSpy}
        />
      );
    });

    it('displays in progress message', function () {
      const inProgressBanner = screen.getByTestId(
        'drop-index-in-progress-banner-wrapper'
      );
      expect(inProgressBanner).to.contain.text('Index dropping in progress');
    });
  });

  context('when error', function () {
    beforeEach(function () {
      render(
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
          clearError={clearErrorSpy}
        />
      );
    });

    it('displays the error message', function () {
      const errorBanner = screen.getByTestId('drop-index-error-banner-wrapper');
      expect(errorBanner).to.contain.text('test error');
    });
  });
});
