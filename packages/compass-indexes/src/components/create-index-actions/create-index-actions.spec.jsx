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

import CreateIndexActions from '../create-index-actions';

describe('CreateIndexActions Component', function () {
  let toggleIsVisibleSpy;
  let clearErrorSpy;
  let createIndexSpy;
  let resetFormSpy;

  beforeEach(function () {
    toggleIsVisibleSpy = sinon.spy();
    clearErrorSpy = sinon.spy();
    createIndexSpy = sinon.spy();
    resetFormSpy = sinon.spy();
  });

  afterEach(function () {
    toggleIsVisibleSpy = null;
    clearErrorSpy = null;
    createIndexSpy = null;
    resetFormSpy = null;

    cleanup();
  });

  it('renders a cancel button', function () {
    render(
      <CreateIndexActions
        toggleIsVisible={toggleIsVisibleSpy}
        resetForm={resetFormSpy}
        error={null}
        clearError={clearErrorSpy}
        inProgress={false}
        createIndex={createIndexSpy}
      />
    );

    const button = screen.getByTestId('create-index-actions-cancel-button');
    expect(button.textContent).to.be.equal('Cancel');
  });

  context('onCancel', function () {
    it('calls the toggleIsVisible function', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={null}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
        />
      );

      const button = screen.getByTestId('create-index-actions-cancel-button');
      fireEvent.click(button);
      expect(toggleIsVisibleSpy).to.have.been.calledWith(false);
    });

    it('calls the resetForm function', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={null}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
        />
      );

      const button = screen.getByTestId('create-index-actions-cancel-button');
      fireEvent.click(button);
      expect(resetFormSpy).to.have.been.calledOnce;
    });
  });

  context('onConfirm', function () {
    it('calls the createIndex function', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={null}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
        />
      );

      const button = screen.getByTestId(
        'create-index-actions-create-index-button'
      );
      fireEvent.click(button);
      expect(createIndexSpy).to.have.been.calledOnce;
    });
  });

  it('renders a create index button', function () {
    render(
      <CreateIndexActions
        toggleIsVisible={toggleIsVisibleSpy}
        resetForm={resetFormSpy}
        error={null}
        clearError={clearErrorSpy}
        inProgress={false}
        createIndex={createIndexSpy}
      />
    );

    const button = screen.getByTestId(
      'create-index-actions-create-index-button'
    );
    expect(button.textContent).to.be.equal('Create Index');
  });

  context('with error', function () {
    it('renders error banner', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={'Some error happened!'}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
        />
      );

      const errorBanner = screen.getByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      expect(errorBanner).to.contain.text('Some error happened!');
    });

    it('closes error banner', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={'Some error happened!'}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
        />
      );

      const errorBanner = screen.getByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      const closeIcon = within(errorBanner).getByLabelText('X Icon');

      fireEvent.click(closeIcon);
      expect(clearErrorSpy).to.have.been.calledOnce;
    });

    it('does not render in progress banner', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={'Some error happened!'}
          clearError={clearErrorSpy}
          inProgress={true}
          createIndex={createIndexSpy}
        />
      );

      const inProgressBanner = screen.queryByTestId(
        'create-index-actions-in-progress-banner-wrapper'
      );
      expect(inProgressBanner).to.not.exist;
    });
  });

  context('without error', function () {
    it('does not render error banner', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={null}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
        />
      );

      const errorBanner = screen.queryByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      expect(errorBanner).to.not.exist;
    });

    it('renders in progress banner', function () {
      render(
        <CreateIndexActions
          toggleIsVisible={toggleIsVisibleSpy}
          resetForm={resetFormSpy}
          error={null}
          clearError={clearErrorSpy}
          inProgress={true}
          createIndex={createIndexSpy}
        />
      );

      const inProgressBanner = screen.getByTestId(
        'create-index-actions-in-progress-banner-wrapper'
      );
      expect(inProgressBanner).to.contain.text('Create in Progress');
    });
  });
});
