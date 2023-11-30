import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { RenameCollectionPlugin } from '../..';
import AppRegistry from 'hadron-app-registry';

describe('CreateCollectionModal [Component]', function () {
  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService = {
    renameCollection: sandbox.stub().resolves({}),
  };
  context('when the modal is visible', function () {
    beforeEach(function () {
      const Plugin = RenameCollectionPlugin.withMockServices({
        globalAppRegistry: appRegistry,
        dataService,
      });
      render(<Plugin> </Plugin>);
      appRegistry.emit('open-rename-collection', {
        database: 'foo',
        collection: 'bar',
      });
    });

    afterEach(function () {
      sandbox.resetHistory();
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
      const input: HTMLInputElement = screen.getByTestId(
        'rename-collection-name-input'
      );
      expect(input.value).to.equal('bar');
    });

    it('disables the submit button when the value is equal to the initial collection name', () => {
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
