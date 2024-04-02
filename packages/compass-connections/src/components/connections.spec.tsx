import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import { expect } from 'chai';
import type { ConnectionOptions, connect } from 'mongodb-data-service';
import {
  type ConnectionInfo,
  type ConnectionStorage,
  ConnectionStorageBus,
} from '@mongodb-js/connection-storage/renderer';
import { v4 as uuid } from 'uuid';
import sinon from 'sinon';
import Connections from './connections';
import { ToastArea } from '@mongodb-js/compass-components';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { ConnectionStorageContext } from '@mongodb-js/connection-storage/provider';
import { ConnectionsManager, ConnectionsManagerProvider } from '../provider';
import type { DataService } from 'mongodb-data-service';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

function getConnectionsManager(mockTestConnectFn?: typeof connect) {
  const { log } = createNoopLoggerAndTelemetry();
  return new ConnectionsManager({
    logger: log.unbound,
    __TEST_CONNECT_FN: mockTestConnectFn,
  });
}

function getMockConnectionStorage(mockConnections: ConnectionInfo[]) {
  return {
    events: new ConnectionStorageBus(),
    loadAll: () => {
      return Promise.resolve(mockConnections);
    },
    getLegacyConnections: () => Promise.resolve([]),
    save: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    load: (id: string) =>
      Promise.resolve(mockConnections.find((conn) => conn.id === id)),
    importConnections: () => Promise.resolve([]),
    exportConnections: () => Promise.resolve('{}'),
    deserializeConnections: () => Promise.resolve([]),
  } as unknown as typeof ConnectionStorage;
}

async function loadSavedConnectionAndConnect(connectionInfo: ConnectionInfo) {
  const savedConnectionButton = screen.getByTestId(
    `saved-connection-button-${connectionInfo.id}`
  );
  fireEvent.click(savedConnectionButton);

  // Wait for the connection to load in the form.
  await waitFor(() =>
    expect(screen.queryByRole('textbox')?.textContent).to.equal(
      connectionInfo.connectionOptions.connectionString
    )
  );

  const connectButton = screen.getByText('Connect');
  fireEvent.click(connectButton);

  // Wait for the connecting... modal to hide.
  await waitFor(() => expect(screen.queryByText('Cancel')).to.not.exist);
}

describe('Connections Component', function () {
  let preferences: PreferencesAccess;
  let onConnectedSpy: sinon.SinonSpy;
  let onConnectionFailedSpy: sinon.SinonSpy;
  let onConnectionAttemptStartedSpy: sinon.SinonSpy;

  before(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({ persistOIDCTokens: false });
  });

  beforeEach(function () {
    onConnectedSpy = sinon.spy();
    onConnectionFailedSpy = sinon.spy();
    onConnectionAttemptStartedSpy = sinon.spy();
  });

  afterEach(function () {
    sinon.restore();
    cleanup();
  });

  context('when rendered', function () {
    let loadConnectionsSpy: sinon.SinonSpy;
    beforeEach(function () {
      const mockStorage = getMockConnectionStorage([]);
      loadConnectionsSpy = sinon.spy(mockStorage, 'loadAll');
      render(
        <PreferencesProvider value={preferences}>
          <ConnectionStorageContext.Provider value={mockStorage}>
            <ConnectionsManagerProvider value={getConnectionsManager()}>
              <Connections
                onConnected={onConnectedSpy}
                onConnectionFailed={onConnectionFailedSpy}
                onConnectionAttemptStarted={onConnectionAttemptStartedSpy}
                appName="Test App Name"
              />
            </ConnectionsManagerProvider>
          </ConnectionStorageContext.Provider>
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
    let mockStorage: typeof ConnectionStorage;
    let savedConnectionId: string;
    let savedConnectionWithAppNameId: string;
    let saveConnectionSpy: sinon.SinonSpy;
    let connections: ConnectionInfo[];

    beforeEach(async function () {
      savedConnectionId = uuid();
      savedConnectionWithAppNameId = uuid();
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
      mockStorage = getMockConnectionStorage(connections);
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
          <ConnectionStorageContext.Provider value={mockStorage}>
            <ConnectionsManagerProvider value={connectionsManager}>
              <ToastArea>
                <Connections
                  onConnected={onConnectedSpy}
                  onConnectionFailed={onConnectionFailedSpy}
                  onConnectionAttemptStarted={onConnectionAttemptStartedSpy}
                  appName="Test App Name"
                />
              </ToastArea>
            </ConnectionsManagerProvider>
          </ConnectionStorageContext.Provider>
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

        it('should emit the connection configuration used to connect', function () {
          expect(onConnectedSpy.firstCall.args[0].id).to.equal(
            savedConnectionId
          );
          expect(
            onConnectedSpy.firstCall.args[0].connectionOptions
          ).to.deep.equal({
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          });
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
        savedConnectableId = uuid();
        savedUnconnectableId = uuid();

        mockConnectFn = sinon.fake(
          async ({
            connectionOptions,
          }: {
            connectionOptions: ConnectionOptions;
          }) => {
            if (
              connectionOptions.connectionString ===
              'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000&appName=Test+App+Name'
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
        const mockStorage = getMockConnectionStorage(connections);
        sinon.replace(mockStorage, 'save', saveConnectionSpy);

        render(
          <PreferencesProvider value={preferences}>
            <ConnectionStorageContext.Provider value={mockStorage}>
              <ConnectionsManagerProvider value={connectionsManager}>
                <ToastArea>
                  <Connections
                    onConnected={onConnectedSpy}
                    onConnectionFailed={onConnectionFailedSpy}
                    onConnectionAttemptStarted={onConnectionAttemptStartedSpy}
                    appName="Test App Name"
                  />
                </ToastArea>
              </ConnectionsManagerProvider>
            </ConnectionStorageContext.Provider>
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
          expect(screen.queryByRole('textbox')?.textContent).to.equal(
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

        it('should not emit connected', function () {
          expect(onConnectedSpy.called).to.equal(false);
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

            it('should call onConnected once', function () {
              expect(onConnectedSpy.callCount).to.equal(1);
            });

            it('should call to save the connection once', function () {
              expect(saveConnectionSpy.callCount).to.equal(1);
            });

            it('should emit the connection configuration used to connect', function () {
              expect(onConnectedSpy.firstCall.args[0].id).to.equal(
                savedConnectableId
              );
              expect(
                onConnectedSpy.firstCall.args[0].connectionOptions
              ).to.deep.equal({
                connectionString:
                  'mongodb://localhost:27018/?readPreference=primary&ssl=false',
              });
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

  context('when user has any legacy connection', function () {
    it('shows modal', async function () {
      const mockStorage = getMockConnectionStorage([]);
      sinon
        .stub(mockStorage, 'getLegacyConnections')
        .resolves([{ name: 'Connection1' }]);

      render(
        <PreferencesProvider value={preferences}>
          <ConnectionStorageContext.Provider value={mockStorage}>
            <ConnectionsManagerProvider value={getConnectionsManager()}>
              <ToastArea>
                <Connections
                  onConnected={onConnectedSpy}
                  onConnectionFailed={onConnectionFailedSpy}
                  onConnectionAttemptStarted={onConnectionAttemptStartedSpy}
                  appName="Test App Name"
                />
              </ToastArea>
            </ConnectionsManagerProvider>
          </ConnectionStorageContext.Provider>
        </PreferencesProvider>
      );

      await waitFor(
        () => expect(screen.getByTestId('legacy-connections-modal')).to.exist
      );

      const modal = screen.getByTestId('legacy-connections-modal');
      expect(within(modal).getByText('Connection1')).to.exist;
    });

    it('does not show modal when user hides it', async function () {
      const mockStorage = getMockConnectionStorage([]);
      sinon
        .stub(mockStorage, 'getLegacyConnections')
        .resolves([{ name: 'Connection2' }]);

      const { rerender } = render(
        <PreferencesProvider value={preferences}>
          <ConnectionStorageContext.Provider value={mockStorage}>
            <ConnectionsManagerProvider value={getConnectionsManager()}>
              <ToastArea>
                <Connections
                  onConnected={onConnectedSpy}
                  onConnectionFailed={onConnectionFailedSpy}
                  onConnectionAttemptStarted={onConnectionAttemptStartedSpy}
                  appName="Test App Name"
                />
              </ToastArea>
            </ConnectionsManagerProvider>
          </ConnectionStorageContext.Provider>
        </PreferencesProvider>
      );

      await waitFor(() => screen.getByTestId('legacy-connections-modal'));

      const modal = screen.getByTestId('legacy-connections-modal');

      const storageSpy = sinon.spy(Storage.prototype, 'setItem');

      // Click the don't show again checkbox and close the modal
      fireEvent.click(within(modal).getByText(/don't show this again/i));
      fireEvent.click(within(modal).getByText(/close/i));

      rerender(
        <PreferencesProvider value={preferences}>
          <ConnectionStorageContext.Provider value={mockStorage}>
            <ConnectionsManagerProvider value={getConnectionsManager()}>
              <ToastArea>
                <Connections
                  onConnected={onConnectedSpy}
                  onConnectionFailed={onConnectionFailedSpy}
                  onConnectionAttemptStarted={onConnectionAttemptStartedSpy}
                  appName="Test App Name"
                />
              </ToastArea>
            </ConnectionsManagerProvider>
          </ConnectionStorageContext.Provider>
        </PreferencesProvider>
      );

      // Saves data in storage
      expect(storageSpy.firstCall.args).to.deep.equal([
        'hide_legacy_connections_modal',
        'true',
      ]);

      expect(() => {
        screen.getByTestId('legacy-connections-modal');
      }).to.throw;
    });
  });
});
