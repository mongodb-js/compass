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

const noop = () => {};

describe('CreateIndexActions Component', function () {
  let clearErrorSpy;
  let createIndexSpy;
  let closeCreateIndexModalSpy;

  beforeEach(function () {
    clearErrorSpy = sinon.spy();
    createIndexSpy = sinon.spy();
    closeCreateIndexModalSpy = sinon.spy();
  });

  afterEach(function () {
    clearErrorSpy = null;
    createIndexSpy = null;
    closeCreateIndexModalSpy = null;

    cleanup();
  });

  it('renders a cancel button', function () {
    render(
      <CreateIndexActions
        error={null}
        clearError={clearErrorSpy}
        inProgress={false}
        createIndex={createIndexSpy}
        closeCreateIndexModal={closeCreateIndexModalSpy}
      />
    );

    const button = screen.getByTestId('create-index-actions-cancel-button');
    expect(button.textContent).to.be.equal('Cancel');
  });

  context('onCancel', function () {
    it('calls the closeCreateIndexModal function', function () {
      render(
        <CreateIndexActions
          error={null}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
          closeCreateIndexModal={closeCreateIndexModalSpy}
        />
      );

      const button = screen.getByTestId('create-index-actions-cancel-button');
      fireEvent.click(button);
      expect(closeCreateIndexModalSpy).to.have.been.calledOnce;
    });
  });

  context('onConfirm', function () {
    it('calls the createIndex function', function () {
      render(
        <CreateIndexActions
          error={null}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
          closeCreateIndexModal={closeCreateIndexModalSpy}
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
        error={null}
        clearError={clearErrorSpy}
        inProgress={false}
        createIndex={createIndexSpy}
        closeCreateIndexModal={closeCreateIndexModalSpy}
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
          error={'Some error happened!'}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
          closeCreateIndexModal={closeCreateIndexModalSpy}
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
          error={'Some error happened!'}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
          closeCreateIndexModal={closeCreateIndexModalSpy}
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
          error={'Some error happened!'}
          clearError={clearErrorSpy}
          inProgress={true}
          createIndex={createIndexSpy}
          closeCreateIndexModal={closeCreateIndexModalSpy}
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
          error={null}
          clearError={clearErrorSpy}
          inProgress={false}
          createIndex={createIndexSpy}
          closeCreateIndexModal={closeCreateIndexModalSpy}
        />
      );

      const errorBanner = screen.queryByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      expect(errorBanner).to.not.exist;
    });

    context('when in progress', function () {
      beforeEach(function () {
        render(
          <CreateIndexActions
            error={null}
            clearError={noop}
            inProgress={true}
            createIndex={noop}
            closeCreateIndexModal={noop}
          />
        );
      });

      afterEach(cleanup);

      it('renders in progress banner', function () {
        const inProgressBanner = screen.getByTestId(
          'create-index-actions-in-progress-banner-wrapper'
        );
        expect(inProgressBanner).to.contain.text('Index creation in progress');
      });

      it('hides the create index button', function () {
        const createIndexButton = screen.queryByTestId(
          'create-index-actions-create-index-button'
        );
        expect(createIndexButton).to.not.exist;
      });

      it('renames the cancel button to close', function () {
        const cancelButton = screen.getByTestId(
          'create-index-actions-cancel-button'
        );
        expect(cancelButton.textContent).to.be.equal('Close');
      });
    });
  });
});
