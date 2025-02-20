import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import {
  screen,
  cleanup,
  userEvent,
  waitFor,
  renderWithConnections,
  createDefaultConnectionInfo,
} from '@mongodb-js/testing-library-compass';
import { RenameCollectionPlugin } from '../..';
import type AppRegistry from 'hadron-app-registry';

describe('RenameCollectionModal [Component]', function () {
  const connectionId = '12345';
  const sandbox = Sinon.createSandbox();
  let appRegistry: AppRegistry;
  const mockConnection = {
    ...createDefaultConnectionInfo(),
    id: connectionId,
  };
  const instancesManager = {
    getMongoDBInstanceForConnection: sandbox.stub().returns({
      databases: {
        get: function () {
          return {
            collections: [{ name: 'my-collection' }],
          };
        },
      },
    }),
  };
  let renameCollectionSpy: Sinon.SinonSpy;

  context('when the modal is visible', function () {
    beforeEach(async function () {
      const Plugin = RenameCollectionPlugin.withMockServices({
        instancesManager: instancesManager as any,
      });
      const {
        globalAppRegistry,
        getDataServiceForConnection,
        connectionsStore,
      } = renderWithConnections(<Plugin></Plugin>, {
        connections: [mockConnection],
        connectFn() {
          return {
            renameCollection() {
              return Promise.resolve({} as any);
            },
            createDataKey() {
              return Promise.resolve({});
            },
            configuredKMSProviders() {
              return [];
            },
          };
        },
      });

      await connectionsStore.actions.connect(mockConnection);

      appRegistry = globalAppRegistry;

      renameCollectionSpy = sandbox.spy(
        getDataServiceForConnection(connectionId),
        'renameCollection'
      );
      appRegistry.emit(
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

      userEvent.clear(input);
      userEvent.type(input, 'baz');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('false');
      userEvent.clear(input);
      userEvent.type(input, 'bar');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');
    });

    it('disables the submit button when the value is empty', () => {
      const submitButton = screen.getByTestId('submit-button');
      const input = screen.getByTestId('rename-collection-name-input');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');

      userEvent.clear(input);
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');
    });

    it('disables the submit button when the value exists as a collection in the current database', () => {
      const submitButton = screen.getByTestId('submit-button');
      const input = screen.getByTestId('rename-collection-name-input');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');

      userEvent.clear(input);
      userEvent.type(input, 'my-collection');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');
    });

    context('when the user has submitted the form', () => {
      beforeEach(() => {
        const submitButton = screen.getByTestId('submit-button');
        const input = screen.getByTestId('rename-collection-name-input');
        userEvent.clear(input);
        userEvent.type(input, 'baz');
        userEvent.click(submitButton);

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
    });

    context(
      'when the user has submitted the form with extra whitespaces',
      () => {
        beforeEach(() => {
          const submitButton = screen.getByTestId('submit-button');
          const input = screen.getByTestId('rename-collection-name-input');
          userEvent.clear(input);
          userEvent.type(input, '  baz  ');
          userEvent.click(submitButton);

          expect(screen.getByTestId('rename-collection-modal')).to.exist;

          const confirmationButton = screen.getByTestId('submit-button');
          expect(confirmationButton.textContent).to.equal(
            'Yes, rename collection'
          );

          userEvent.click(confirmationButton);
        });

        it('trims the white spaces on submit', () => {
          expect(renameCollectionSpy).to.have.been.calledWithExactly(
            'foo.bar',
            'baz'
          );
        });
      }
    );
  });

  context(
    'when the user has saved aggregations or queries for the old namespace',
    function () {
      beforeEach(async function () {
        const queryStorage = {
          getStorage: () => ({
            loadAll: sandbox.stub().resolves([]),
          }),
        };
        const pipelineStorage = {
          loadAll: sandbox.stub().resolves([{ namespace: 'foo.bar' }]),
        };
        const Plugin = RenameCollectionPlugin.withMockServices({
          instancesManager: instancesManager as any,
          queryStorage: queryStorage as any,
          pipelineStorage: pipelineStorage as any,
        });
        const {
          globalAppRegistry,
          getDataServiceForConnection,
          connectionsStore,
        } = renderWithConnections(<Plugin></Plugin>, {
          connections: [mockConnection],
          connectFn() {
            return {
              renameCollection() {
                return Promise.resolve({} as any);
              },
              createDataKey() {
                return Promise.resolve({});
              },
              configuredKMSProviders() {
                return [];
              },
            };
          },
        });

        await connectionsStore.actions.connect(mockConnection);

        appRegistry = globalAppRegistry;

        renameCollectionSpy = sandbox.spy(
          getDataServiceForConnection(connectionId),
          'renameCollection'
        );
        appRegistry.emit(
          'open-rename-collection',
          {
            database: 'foo',
            collection: 'bar',
          },
          { connectionId: '12345' }
        );

        await waitFor(() =>
          screen.getByRole('heading', { name: 'Rename collection' })
        );

        const submitButton = screen.getByTestId('submit-button');
        const input = screen.getByTestId('rename-collection-name-input');
        userEvent.clear(input);
        userEvent.type(input, 'baz');
        userEvent.click(submitButton);

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
    }
  );
});
