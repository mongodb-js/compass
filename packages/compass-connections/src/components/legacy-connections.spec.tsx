import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { expect } from 'chai';
import type { ConnectionOptions, connect } from 'mongodb-data-service';
import { UUID } from 'bson';
import sinon from 'sinon';
import Connections from './legacy-connections';
import { ToastArea } from '@mongodb-js/compass-components';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import {
  InMemoryConnectionStorage,
  ConnectionStorageProvider,
  type ConnectionStorage,
  type ConnectionInfo,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionsManager, ConnectionsManagerProvider } from '../provider';
import type { DataService } from 'mongodb-data-service';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { ConnectionsProvider } from './connections-provider';

function getConnectionsManager(mockTestConnectFn?: typeof connect) {
  const { log } = createNoopLogger();
  return new ConnectionsManager({
    logger: log.unbound,
    __TEST_CONNECT_FN: mockTestConnectFn,
  });
}

async function loadSavedConnectionAndConnect(connectionInfo: ConnectionInfo) {
  const savedConnectionButton = screen.getByTestId(
    `saved-connection-button-${connectionInfo.id}`
  );
  fireEvent.click(savedConnectionButton);

  // Wait for the connection to load in the form.
  await waitFor(() =>
    expect(screen.queryByTestId('connectionString')?.textContent).to.equal(
      connectionInfo.connectionOptions.connectionString
    )
  );

  const connectButton = screen.getByText('Connect');
  fireEvent.click(connectButton);

  // Wait for the connecting... modal to hide.
  await waitFor(() => expect(screen.queryByText('Cancel')).to.not.exist);
}

// TODO(COMPASS-7906): remove
describe.skip('Connections Component', function () {
  let preferences: PreferencesAccess;

  before(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({ persistOIDCTokens: false });
  });

  afterEach(function () {
    sinon.restore();
    cleanup();
  });

  context('when rendered', function () {
    let loadConnectionsSpy: sinon.SinonSpy;
    beforeEach(function () {
      const mockStorage = new InMemoryConnectionStorage([]);
      loadConnectionsSpy = sinon.spy(mockStorage, 'loadAll');
      render(
        <PreferencesProvider value={preferences}>
          <ConnectionStorageProvider value={mockStorage}>
            <ConnectionsManagerProvider value={getConnectionsManager()}>
              <ConnectionsProvider>
                <Connections appRegistry={{} as any} />
              </ConnectionsProvider>
            </ConnectionsManagerProvider>
          </ConnectionStorageProvider>
        </PreferencesProvider>
      );
    });

    it('calls once to load the connections', function () {
      expect(loadConnectionsSpy.callCount).to.equal(1);
    });

    it('renders the connect button from the connect-form', function () {
      const button = screen.queryByText('Connect')?.closest('button');
      expect(button).to.not.equal(null);
    });

    it('renders atlas cta button', function () {
      const button = screen.getByTestId('atlas-cta-link');
      expect(button.getAttribute('href')).to.equal(
        'https://www.mongodb.com/cloud/atlas/lp/try4?utm_source=compass&utm_medium=product&utm_content=v1'
      );
    });

    it('shows two connections lists', function () {
      const listItems = screen.getAllByRole('list');
      expect(listItems.length).to.equal(2);
    });

    it('should not show any banners', function () {
      expect(screen.queryByRole('alert')).to.not.exist;
    });

    it('should load an empty connections list with no connections', function () {
      const listItems = screen.queryAllByRole('listitem');
      expect(listItems.length).to.equal(0);

      const favorites = screen.queryAllByTestId('favorite-connection');
      expect(favorites.length).to.equal(0);

      const recents = screen.queryAllByTestId('recent-connection');
      expect(recents.length).to.equal(0);
    });

    it('should include the help panels', function () {
      expect(screen.queryByText(/How do I find my/)).to.be.visible;
      expect(screen.queryByText(/How do I format my/)).to.be.visible;
    });
  });

  context('when rendered with saved connections in storage', function () {
    let connectSpyFn: sinon.SinonSpy;
    let mockStorage: ConnectionStorage;
    let savedConnectionId: string;
    let savedConnectionWithAppNameId: string;
    let saveConnectionSpy: sinon.SinonSpy;
    let connections: ConnectionInfo[];

    beforeEach(async function () {
      savedConnectionId = new UUID().toString();
      savedConnectionWithAppNameId = new UUID().toString();
      saveConnectionSpy = sinon.spy();

      connections = [
        {
          id: savedConnectionId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          },
        },
        {
          id: savedConnectionWithAppNameId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27019/?appName=Some+App+Name',
          },
        },
      ];
      mockStorage = new InMemoryConnectionStorage(connections);
      sinon.replace(mockStorage, 'save', saveConnectionSpy);

      const connectionsManager = getConnectionsManager(() => {
        return Promise.resolve({
          mockDataService: 'yes',
          addReauthenticationHandler() {},
        } as unknown as DataService);
      });
      connectSpyFn = sinon.spy(connectionsManager, 'connect');

      render(
        <PreferencesProvider value={preferences}>
          <ConnectionStorageProvider value={mockStorage}>
            <ConnectionsManagerProvider value={connectionsManager}>
              <ToastArea>
                <Connections appRegistry={{} as any} />
              </ToastArea>
            </ConnectionsManagerProvider>
          </ConnectionStorageProvider>
        </PreferencesProvider>
      );

      await waitFor(() => expect(screen.queryAllByRole('listitem')).to.exist);
    });

    it('should render the saved connections', function () {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).to.equal(2);

      const favorites = screen.queryAllByTestId('favorite-connection');
      expect(favorites.length).to.equal(0);

      const recents = screen.getAllByTestId('recent-connection');
      expect(recents.length).to.equal(2);
    });

    it('renders the title of the saved connection', function () {
      expect(screen.getByText('localhost:27018')).to.be.visible;
    });

    context(
      'when a saved connection is clicked on and connected to',
      function () {
        const _Date = globalThis.Date;
        beforeEach(async function () {
          globalThis.Date = class {
            constructor() {
              return new _Date(0);
            }
            static now() {
              return 0;
            }
          } as DateConstructor;
          await loadSavedConnectionAndConnect(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            connections.find(({ id }) => id === savedConnectionId)!
          );
        });

        afterEach(function () {
          globalThis.Date = _Date;
        });

        it('should call the connect function on ConnectionsManager with the connection options to connect', function () {
          expect(connectSpyFn.callCount).to.equal(1);
          expect(
            connectSpyFn.firstCall.args[0].connectionOptions
          ).to.deep.equal({
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          });
        });

        it('should call to save the connection with the connection config', function () {
          expect(saveConnectionSpy.callCount).to.equal(1);
          expect(
            saveConnectionSpy.firstCall.args[0].connectionInfo.id
          ).to.equal(savedConnectionId);
          expect(
            saveConnectionSpy.firstCall.args[0].connectionInfo.connectionOptions
          ).to.deep.equal({
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          });
        });

        it('should call to save the connection with a new lastUsed time', function () {
          expect(saveConnectionSpy.callCount).to.equal(1);
          expect(
            saveConnectionSpy.firstCall.args[0].connectionInfo.lastUsed.getTime()
          ).to.equal(0);
        });
      }
    );

    context(
      'when a saved connection with appName is clicked on and connected to',
      function () {
        beforeEach(async function () {
          await loadSavedConnectionAndConnect(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            connections.find(({ id }) => id === savedConnectionWithAppNameId)!
          );
        });

        it('should call the connect function without replacing appName', function () {
          expect(connectSpyFn.callCount).to.equal(1);
          expect(
            connectSpyFn.firstCall.args[0].connectionOptions
          ).to.deep.equal({
            connectionString:
              'mongodb://localhost:27019/?appName=Some+App+Name',
          });
        });
      }
    );
  });

  context(
    'when connecting to a connection that is not succeeding',
    function () {
      let mockConnectFn: sinon.SinonSpy;
      let saveConnectionSpy: sinon.SinonSpy;
      let savedConnectableId: string;
      let savedUnconnectableId: string;
      let connections: ConnectionInfo[];
      let connectSpyFn: sinon.SinonSpy;

      beforeEach(async function () {
        saveConnectionSpy = sinon.spy();
        savedConnectableId = new UUID().toString();
        savedUnconnectableId = new UUID().toString();

        mockConnectFn = sinon.fake(
          async ({
            connectionOptions,
          }: {
            connectionOptions: ConnectionOptions;
          }) => {
            if (
              connectionOptions.connectionString ===
              'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000'
            ) {
              return new Promise((resolve) => {
                // On first call we want this attempt to be cancelled before
                // this promise resolves.
                setTimeout(() => {
                  resolve({
                    mockDataService: 'yes',
                    addReauthenticationHandler() {},
                  });
                }, 500);
              });
            }
            return Promise.resolve({
              mockDataService: 'yes',
              addReauthenticationHandler() {},
            });
          }
        );

        const connectionsManager = getConnectionsManager(mockConnectFn);
        connectSpyFn = sinon.spy(connectionsManager, 'connect');
        connections = [
          {
            id: savedConnectableId,
            connectionOptions: {
              connectionString:
                'mongodb://localhost:27018/?readPreference=primary&ssl=false',
            },
          },
          {
            id: savedUnconnectableId,
            connectionOptions: {
              connectionString:
                'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000',
            },
          },
        ];
        const mockStorage = new InMemoryConnectionStorage(connections);
        sinon.replace(mockStorage, 'save', saveConnectionSpy);

        render(
          <PreferencesProvider value={preferences}>
            <ConnectionStorageProvider value={mockStorage}>
              <ConnectionsManagerProvider value={connectionsManager}>
                <ToastArea>
                  <Connections appRegistry={{} as any} />
                </ToastArea>
              </ConnectionsManagerProvider>
            </ConnectionStorageProvider>
          </PreferencesProvider>
        );

        await waitFor(
          () =>
            expect(
              screen.queryByTestId(
                `saved-connection-button-${savedUnconnectableId}`
              )
            ).to.exist
        );

        const savedConnectionButton = screen.getByTestId(
          `saved-connection-button-${savedUnconnectableId}`
        );
        fireEvent.click(savedConnectionButton);

        // Wait for the connection to load in the form.
        await waitFor(() =>
          expect(
            screen.queryByTestId('connectionString')?.textContent
          ).to.equal(
            'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000'
          )
        );

        const connectButton = screen.getByText('Connect');
        fireEvent.click(connectButton);

        // Wait for the connecting... modal to be shown.
        await waitFor(() => expect(screen.queryByText('Cancel')).to.be.visible);
      });

      context('when the connection attempt is cancelled', function () {
        beforeEach(async function () {
          const cancelButton = screen.getByText('Cancel');
          fireEvent.click(cancelButton);

          // Wait for the connecting... modal to hide.
          await waitFor(
            () => expect(screen.queryByText('Cancel')).to.not.exist
          );
        });

        it('should enable the connect button', function () {
          const connectButton = screen.getByText('Connect');
          expect(connectButton).to.not.match('disabled');
        });

        it('should not call to save the connection', function () {
          expect(saveConnectionSpy.callCount).to.equal(0);
        });

        it('should have the connections-wrapper test id', function () {
          expect(screen.getByTestId('connections-wrapper')).to.be.visible;
        });

        it('should call the connect function with the connection options to connect', function () {
          expect(connectSpyFn.callCount).to.equal(1);
          expect(
            connectSpyFn.firstCall.args[0].connectionOptions
          ).to.deep.equal({
            connectionString:
              'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000',
          });
        });

        context(
          'connecting to a successful connection after cancelling a connect',
          function () {
            beforeEach(async function () {
              await loadSavedConnectionAndConnect(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                connections.find(({ id }) => id === savedConnectableId)!
              );
            });

            it('should call to save the connection once', function () {
              expect(saveConnectionSpy.callCount).to.equal(1);
            });

            it('should call the connect function with the connection options to connect', function () {
              expect(connectSpyFn.callCount).to.equal(2);
              expect(
                connectSpyFn.secondCall.args[0].connectionOptions
              ).to.deep.equal({
                connectionString:
                  'mongodb://localhost:27018/?readPreference=primary&ssl=false',
              });
            });
          }
        );
      });
    }
  );
});
