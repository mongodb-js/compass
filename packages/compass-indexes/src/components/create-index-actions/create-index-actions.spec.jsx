import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  render,
  screen,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';

import CreateIndexActions from '../create-index-actions';

describe('CreateIndexActions Component', function () {
  let clearErrorSpy;
  let onCreateIndexClickSpy;
  let closeCreateIndexModalSpy;

  beforeEach(function () {
    clearErrorSpy = sinon.spy();
    onCreateIndexClickSpy = sinon.spy();
    closeCreateIndexModalSpy = sinon.spy();
  });

  afterEach(function () {
    clearErrorSpy = null;
    onCreateIndexClickSpy = null;
    closeCreateIndexModalSpy = null;
  });

  it('renders a cancel button', function () {
    render(
      <CreateIndexActions
        error={null}
        onErrorBannerCloseClick={clearErrorSpy}
        onCreateIndexClick={onCreateIndexClickSpy}
        onCancelCreateIndexClick={closeCreateIndexModalSpy}
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
          onErrorBannerCloseClick={clearErrorSpy}
          onCreateIndexClick={onCreateIndexClickSpy}
          onCancelCreateIndexClick={closeCreateIndexModalSpy}
        />
      );

      const button = screen.getByTestId('create-index-actions-cancel-button');
      userEvent.click(button);
      expect(closeCreateIndexModalSpy).to.have.been.calledOnce;
    });
  });

  context('onConfirm', function () {
    it('calls the onCreateIndexClick function', function () {
      render(
        <CreateIndexActions
          error={null}
          onErrorBannerCloseClick={clearErrorSpy}
          onCreateIndexClick={onCreateIndexClickSpy}
          onCancelCreateIndexClick={closeCreateIndexModalSpy}
        />
      );

      const button = screen.getByTestId(
        'create-index-actions-create-index-button'
      );
      userEvent.click(button);
      expect(onCreateIndexClickSpy).to.have.been.calledOnce;
    });
  });

  it('renders a create index button', function () {
    render(
      <CreateIndexActions
        error={null}
        onErrorBannerCloseClick={clearErrorSpy}
        onCreateIndexClick={onCreateIndexClickSpy}
        onCancelCreateIndexClick={closeCreateIndexModalSpy}
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
          onErrorBannerCloseClick={clearErrorSpy}
          onCreateIndexClick={onCreateIndexClickSpy}
          onCancelCreateIndexClick={closeCreateIndexModalSpy}
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
          onErrorBannerCloseClick={clearErrorSpy}
          onCreateIndexClick={onCreateIndexClickSpy}
          onCancelCreateIndexClick={closeCreateIndexModalSpy}
        />
      );

      const errorBanner = screen.getByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      const closeIcon = within(errorBanner).getByLabelText('X Icon');

      userEvent.click(closeIcon);
      expect(clearErrorSpy).to.have.been.calledOnce;
    });
  });

  context('without error', function () {
    it('does not render error banner', function () {
      render(
        <CreateIndexActions
          error={null}
          onErrorBannerCloseClick={clearErrorSpy}
          onCreateIndexClick={onCreateIndexClickSpy}
          onCancelCreateIndexClick={closeCreateIndexModalSpy}
        />
      );

      const errorBanner = screen.queryByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      expect(errorBanner).to.not.exist;
    });
  });
});
