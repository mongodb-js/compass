import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import store from '../stores/rename-collection';

import RenameCollectionModal from './rename-collection-modal';
import { Provider } from 'react-redux';
import { open } from '../modules/rename-collection/rename-collection';

describe('CreateCollectionModal [Component]', function () {
  context('when the modal is visible', function () {
    beforeEach(function () {
      render(
        <Provider store={store}>
          <RenameCollectionModal />
        </Provider>
      );
      store.dispatch(open('foo', 'bar'));
    });

    afterEach(function () {
      cleanup();
    });

    it('renders the correct title', () => {
      expect(screen.getByText('Rename collection')).to.exist;
    });

    it('renders the correct text on the submit button', () => {
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton.textContent).to.equal('Proceed to Rename');
    });

    it('opens with the collection name in the input', () => {
      store.dispatch(open('foo', 'bar'));
      const input = screen.getByTestId('rename-collection-name-input');
      expect(input.value).to.equal('bar');
    });

    it('disables the submit button when the value is equal to the initial collection name', () => {
      store.dispatch(open('foo', 'bar'));
      const submitButton = screen.getByTestId('submit-button');
      const input = screen.getByTestId('rename-collection-name-input');
      expect(submitButton).to.have.attribute('disabled');

      fireEvent.change(input, { target: { value: 'baz' } });
      expect(submitButton).not.to.have.attribute('disabled');
      fireEvent.change(input, { target: { value: 'bar' } });
      expect(submitButton).to.have.attribute('disabled');
    });

    context('when the user has submitted the form', () => {
      beforeEach(() => {
        const submitButton = screen.getByTestId('submit-button');
        const input = screen.getByTestId('rename-collection-name-input');
        fireEvent.change(input, { target: { value: 'baz' } });
        fireEvent.click(submitButton);

        expect(screen.getByTestId('rename-collection-modal')).to.exist;
      });

      it('renders the rename collection confirmation screen', () => {
        expect(screen.getByText('Confirm rename collection')).to.exist;
      });

      it('renders the confirmation warning', () => {
        expect(
          screen.getByText('Are you sure you want to rename "bar" to "baz"?')
        ).to.exist;
      });

      it('renders the correct text on the submit button', () => {
        const submitButton = screen.getByTestId('submit-button');
        expect(submitButton.textContent).to.equal('Yes, rename collection');
      });
    });
  });
});
