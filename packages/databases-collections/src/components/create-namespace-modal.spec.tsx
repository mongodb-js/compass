import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';

import { CreateNamespacePlugin } from '../..';
import AppRegistry from 'hadron-app-registry';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionRepository } from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstance } from 'mongodb-instance-model';

describe('CreateNamespaceModal [Component]', function () {
  const connectionId = '12345';
  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const createNamespaceStub = sandbox.stub().resolves({});
  const dataService = {
    createCollection: createNamespaceStub,
    configuredKMSProviders: sandbox.stub(),
  };
  const instance1 = {
    on: sandbox.stub(),
    off: sandbox.stub(),
    removeListener: sandbox.stub(),
    build: { version: '999.999.999' },
    topologyDescription: { type: 'Unknown' },
  } as unknown as MongoDBInstance;
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
    on: sandbox.stub(),
    removeListener: sandbox.stub(),
  };
  const instancesManager = {
    getMongoDBInstanceForConnection: sandbox.stub().returns(instanceModel),
    listMongoDBInstances: sandbox
      .stub()
      .returns(new Map([[connectionId, instance1]])),
    on: sandbox.stub(),
    removeListener: sandbox.stub(),
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
      const Plugin = CreateNamespacePlugin.withMockServices({
        globalAppRegistry: appRegistry,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        connectionsManager: connectionsManager as any,
        connectionRepository: {
          getConnectionInfoById: () => ({ id: connectionId }),
        } as unknown as ConnectionRepository,
        instancesManager: instancesManager as any,
        queryStorage: favoriteQueries as any,
        pipelineStorage: pipelineStorage as any,
        workspaces: {
          openCollectionWorkspace() {},
        },
      });

      render(<Plugin> </Plugin>);
      appRegistry.emit(
        'open-create-collection',
        {
          database: 'foo',
        },
        { connectionId: '12345' }
      );

      await waitFor(() =>
        screen.getByRole('heading', { name: 'Create Collection' })
      );
    });

    afterEach(function () {
      sandbox.resetHistory();
      cleanup();
    });

    it('renders the correct text on the submit button', () => {
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton.textContent).to.equal('Create Collection');
    });

    it('button is disabled when the input is empty', () => {
      const submitButton = screen.getByTestId('submit-button');
      const input = screen.getByTestId('collection-name');
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');

      fireEvent.change(input, { target: { value: 'baz' } });
      expect(submitButton.getAttribute('aria-disabled')).to.equal('false');
      fireEvent.change(input, { target: { value: '' } });
      expect(submitButton.getAttribute('aria-disabled')).to.equal('true');
    });

    context('when the user has submitted the form (with options)', () => {
      beforeEach(() => {
        const submitButton = screen.getByRole('button', {
          name: 'Create Collection',
        });
        const input = screen.getByRole('textbox', { name: 'Collection Name' });
        const additionalPreferences = screen.getByText(
          /Additional preferences/
        );
        fireEvent.change(input, { target: { value: 'bar' } });
        fireEvent.click(additionalPreferences);
        const clusteredCollection = screen.getByRole('checkbox', {
          name: 'Clustered Collection',
        });
        fireEvent.click(clusteredCollection);
        fireEvent.click(submitButton);
      });

      it('calls the dataservice create collection method', async () => {
        await waitFor(() => {
          expect(createNamespaceStub).to.have.been.calledOnceWith(
            'foo.bar',
            Sinon.match({
              clusteredIndex: {
                unique: true,
              },
            })
          );
        });
      });
    });

    context(
      'when the user has submitted the form with extra whitespaces',
      () => {
        beforeEach(() => {
          const submitButton = screen.getByTestId('submit-button');
          const input = screen.getByTestId('collection-name');
          fireEvent.change(input, { target: { value: '  baz  ' } });
          fireEvent.click(submitButton);
        });

        it('trims the white spaces on submit', async () => {
          await waitFor(() => {
            expect(createNamespaceStub).to.have.been.calledOnceWithExactly(
              'foo.baz',
              {}
            );
          });
        });
      }
    );
  });
});
