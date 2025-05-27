import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  render,
  screen,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { setupStore } from '../../../test/setup-store';
import { Provider } from 'react-redux';

import CreateIndexActions from '.';

describe('CreateIndexActions Component', function () {
  let clearErrorSpy: any;
  let onCreateIndexClickSpy: any;
  let closeCreateIndexModalSpy: any;
  const store = setupStore();

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

  const renderComponent = (error?: string) => {
    render(
      <Provider store={store}>
        <CreateIndexActions
          error={error || null}
          onErrorBannerCloseClick={clearErrorSpy}
          onCreateIndexClick={onCreateIndexClickSpy}
          onCancelCreateIndexClick={closeCreateIndexModalSpy}
          showIndexesGuidanceVariant={false}
        />
      </Provider>
    );
  };
  it('renders a cancel button', function () {
    renderComponent();

    const button = screen.getByTestId('create-index-actions-cancel-button');
    expect(button.textContent).to.be.equal('Cancel');
  });

  context('onCancel', function () {
    it('calls the closeCreateIndexModal function', function () {
      renderComponent();

      const button = screen.getByTestId('create-index-actions-cancel-button');
      userEvent.click(button);
      expect(closeCreateIndexModalSpy).to.have.been.calledOnce;
    });
  });

  context('onConfirm', function () {
    it('calls the onCreateIndexClick function', function () {
      renderComponent();

      const button = screen.getByTestId(
        'create-index-actions-create-index-button'
      );
      userEvent.click(button);
      expect(onCreateIndexClickSpy).to.have.been.calledOnce;
    });
  });

  it('renders a create index button', function () {
    renderComponent();
    const button = screen.getByTestId(
      'create-index-actions-create-index-button'
    );
    expect(button.textContent).to.be.equal('Create Index');
  });

  context('with error', function () {
    it('renders error banner', function () {
      renderComponent('Some error happened!');

      const errorBanner = screen.getByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      expect(errorBanner).to.contain.text('Some error happened!');
    });

    it('closes error banner', function () {
      renderComponent('Some error happened!');

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
      renderComponent();

      const errorBanner = screen.queryByTestId(
        'create-index-actions-error-banner-wrapper'
      );
      expect(errorBanner).to.not.exist;
    });
  });
});
