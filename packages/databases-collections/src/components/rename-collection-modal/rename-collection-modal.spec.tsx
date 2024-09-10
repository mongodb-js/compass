import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { RenameCollectionPlugin } from '../..';

describe('RenameCollectionModal [Component]', function () {
  const sandbox = Sinon.createSandbox();
  const dataService = {
    renameCollection: sandbox.stub().resolves({}),
  };
  const instanceModel = {
    databases: {
      get: function () {
        return {
          collections: [{ name: 'my-collection' }],
        };
      },
    },
  };
  const connectionsManager = {
    getDataServiceForConnection: sandbox.stub().returns(dataService),
  };
  const instancesManager = {
    getMongoDBInstanceForConnection: sandbox.stub().returns(instanceModel),
  };
  const favoriteQueries = {
    getStorage: () => ({
      loadAll: sandbox.stub().resolves([]),
    }),
  };
  const pipelineStorage = {
    loadAll: sandbox.stub().resolves([]),
  };
  context('when the modal is visible', function () {
    beforeEach(async function () {
      const Plugin = RenameCollectionPlugin.withMockServices({
        connectionsManager: connectionsManager as any,
        instancesManager: instancesManager as any,
        queryStorage: favoriteQueries as any,
        pipelineStorage: pipelineStorage as any,
      });
      const { globalAppRegistry } = render(<Plugin> </Plugin>);
      globalAppRegistry.emit(
        'open-rename-collection',
        {
          database: 'foo',
          collection: 'bar',
        },
        { connectionId: '12345' }
      );

      await waitFor(() => screen.getByText('Rename collection'));
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
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');

      fireEvent.change(input, { target: { value: 'baz' } });
      expect(submitButton.getAttribute('aria-disabled')).to.equal('false');
      fireEvent.change(input, { target: { value: 'bar' } });
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');
    });

    it('disables the submit button when the value is empty', () => {
      const submitButton = screen.getByTestId('submit-button');
      const input = screen.getByTestId('rename-collection-name-input');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');

      fireEvent.change(input, { target: { value: '' } });
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');
    });

    it('disables the submit button when the value is exists as a collection in the current database', () => {
      const submitButton = screen.getByTestId('submit-button');
      const input = screen.getByTestId('rename-collection-name-input');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');

      fireEvent.change(input, { target: { value: 'my-collection' } });
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');
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

      it('displays the "unsaved queries / aggregations" may be lost warning', function () {
        const renameCollectionWarningBanner = screen.getByTestId(
          'rename-collection-modal-warning'
        );
        expect(renameCollectionWarningBanner.textContent).to.include(
          'Renaming collection will result in loss of any unsaved queries, filters or aggregation pipelines.'
        );
      });

      describe('when the user has no saved aggregations or queries for the old namespace', function () {
        it('does not display the saved queries and aggregations warning', () => {
          const renameCollectionWarningBanner = screen.getByTestId(
            'rename-collection-modal-warning'
          );
          expect(renameCollectionWarningBanner.textContent).not.to.include(
            'Additionally, any saved queries or aggregations targeting this collection will need to be remapped to the new namespace.'
          );
        });
      });

      describe('when the user has saved aggregations or queries for the old namespace', function () {
        beforeEach(async function () {
          cleanup();
          pipelineStorage.loadAll.resolves([{ namespace: 'foo.bar' }]);
          connectionsManager.getDataServiceForConnection.returns(dataService);
          instancesManager.getMongoDBInstanceForConnection.returns(
            instanceModel
          );

          const Plugin = RenameCollectionPlugin.withMockServices({
            connectionsManager: connectionsManager as any,
            instancesManager: instancesManager as any,
            queryStorage: favoriteQueries as any,
            pipelineStorage: pipelineStorage as any,
          });
          const { globalAppRegistry } = render(<Plugin> </Plugin>);
          globalAppRegistry.emit(
            'open-rename-collection',
            {
              database: 'foo',
              collection: 'bar',
            },
            { connectionId: '12345' }
          );

          await waitFor(() => screen.getByText('Rename collection'));

          const submitButton = screen.getByTestId('submit-button');
          const input = screen.getByTestId('rename-collection-name-input');
          fireEvent.change(input, { target: { value: 'baz' } });
          fireEvent.click(submitButton);

          expect(screen.getByTestId('rename-collection-modal')).to.exist;
        });
        it('does not display the saved queries and aggregations warning', () => {
          const renameCollectionWarningBanner = screen.getByTestId(
            'rename-collection-modal-warning'
          );
          expect(renameCollectionWarningBanner.textContent).to.include(
            'Additionally, any saved queries or aggregations targeting this collection will need to be remapped to the new namespace.'
          );
        });
      });
    });
  });
});
