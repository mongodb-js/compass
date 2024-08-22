import { expect } from 'chai';
import { waitFor, cleanup, screen, render } from '@testing-library/react';
import sinon from 'sinon';
import { createNewConnectionInfo } from './connections-store';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/main';
import {
  InMemoryConnectionStorage,
  type ConnectionStorage,
  ConnectionStorageProvider,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionsManager, ConnectionsManagerProvider } from '../provider';
import type { DataService, connect } from 'mongodb-data-service';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { ComponentProps } from 'react';
import React from 'react';
import {
  ConfirmationModalArea,
  ToastArea,
} from '@mongodb-js/compass-components';
import {
  ConnectionsProvider,
  useConnections,
} from '../components/connections-provider';
import {
  TelemetryProvider,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

function getConnectionsManager(mockTestConnectFn?: typeof connect) {
  const { log } = createNoopLogger();
  return new ConnectionsManager({
    logger: log.unbound,
    __TEST_CONNECT_FN: mockTestConnectFn,
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createMockDataService() {
  return {
    mockDataService: 'yes',
    addReauthenticationHandler() {},
    getUpdatedSecrets() {
      return Promise.resolve({});
    },
    disconnect() {},
  } as unknown as DataService;
}

const mockConnections: ConnectionInfo[] = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    favorite: {
      name: 'turtles',
    },
    savedConnectionType: 'favorite',
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    favorite: {
      name: 'peaches',
    },
    savedConnectionType: 'favorite',
  },
];

describe('useConnections', function () {
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: ConnectionStorage;
  let preferences: PreferencesAccess;
  let renderHookWithContext: (
    props?: ComponentProps<typeof ConnectionsProvider>
  ) => { current: ReturnType<typeof useConnections> };
  let trackSpy: TrackFunction;

  before(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    trackSpy = sinon.spy();
    renderHookWithContext = (props) => {
      const wrapper: React.FC = ({ children }) => {
        return (
          <ToastArea>
            <ConfirmationModalArea>
              <TelemetryProvider
                options={{
                  sendTrack: trackSpy,
                }}
              >
                <PreferencesProvider value={preferences}>
                  <ConnectionStorageProvider value={mockConnectionStorage}>
                    <ConnectionsManagerProvider value={connectionsManager}>
                      <ConnectionsProvider {...props}>
                        {children}
                      </ConnectionsProvider>
                    </ConnectionsManagerProvider>
                  </ConnectionStorageProvider>
                </PreferencesProvider>
              </TelemetryProvider>
            </ConfirmationModalArea>
          </ToastArea>
        );
      };
      const hookResult: { current: ReturnType<typeof useConnections> } = {
        current: {} as any,
      };
      const UseConnections = () => {
        hookResult.current = useConnections();
        return null;
      };
      render(<UseConnections></UseConnections>, { wrapper });
      return hookResult;
    };
  });

  beforeEach(async function () {
    await preferences.savePreferences({
      enableNewMultipleConnectionSystem: true,
      maximumNumberOfActiveConnections: undefined,
    });
    mockConnectionStorage = new InMemoryConnectionStorage([...mockConnections]);
    connectionsManager = getConnectionsManager(async () => {
      await wait(200);
      return createMockDataService();
    });
  });

  afterEach(() => {
    cleanup();
    sinon.resetHistory();
    sinon.restore();
  });

  it('autoconnects on mount and does not save autoconnect info', async function () {
    const onConnected = sinon.spy();
    sinon.stub(mockConnectionStorage, 'getAutoConnectInfo').resolves({
      id: 'new',
      connectionOptions: {
        connectionString: 'mongodb://autoconnect',
      },
    });
    const saveSpy = sinon.spy(mockConnectionStorage, 'save');

    renderHookWithContext({ onConnected });

    await waitFor(() => {
      expect(onConnected).to.have.been.calledOnce;
    });

    // autoconnect info should never be saved
    expect(saveSpy).to.not.have.been.called;
  });

  describe('#connect', function () {
    it('should show notifications throughout connection flow and save connection on disk', async function () {
      const onConnectionAttemptStarted = sinon.spy();
      const onConnected = sinon.spy();
      const connections = renderHookWithContext({
        onConnectionAttemptStarted,
        onConnected,
      });
      const saveSpy = sinon.spy(mockConnectionStorage, 'save');

      const connectionInfo = createNewConnectionInfo();
      const connectPromise = connections.current.connect(connectionInfo);

      await waitFor(() => {
        expect(onConnectionAttemptStarted).to.have.been.calledOnce;
      });

      // First time to save new connection in the storage
      expect(saveSpy).to.have.been.calledOnce;

      await waitFor(() => {
        expect(screen.getByText('Connecting to localhost:27017')).to.exist;
      });

      await connectPromise;

      expect(screen.getByText('Connected to localhost:27017')).to.exist;

      // Second time to update the connection lastUsed time
      expect(saveSpy).to.have.been.calledTwice;

      expect(onConnected).to.have.been.calledOnce;
    });

    it('should show error toast if connection failed', async function () {
      const onConnectionFailed = sinon.spy();
      const connections = renderHookWithContext({
        onConnectionFailed,
      });

      const connectionInfo = createNewConnectionInfo();

      sinon
        .stub(connectionsManager, 'connect')
        .rejects(new Error('Failed to connect to cluster'));

      const connectPromise = connections.current.connect(connectionInfo);

      await waitFor(() => {
        expect(screen.getByText('Failed to connect to cluster')).to.exist;
      });

      try {
        // Connect method should not reject, all the logic is encapsulated,
        // there is no reason to expose it
        await connectPromise;
      } catch (err) {
        expect.fail('Expected connect() method to not throw');
      }
    });

    it('should show non-genuine modal at the end of connection if non genuine mongodb detected', async function () {
      const connections = renderHookWithContext();

      await connections.current.connect({
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://dummy:1234@dummy-name.cosmos.azure.com:443/?ssl=true',
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/appears to be an emulation of MongoDB/)).to
          .exist;
      });
    });

    it('should show max connections toast if maximum connections number reached', async function () {
      await preferences.savePreferences({
        maximumNumberOfActiveConnections: 0,
      });

      const connections = renderHookWithContext();
      const connectionInfo = createNewConnectionInfo();

      const connectPromise = connections.current.connect(connectionInfo);

      await waitFor(() => {
        expect(screen.getByText(/First disconnect from another connection/)).to
          .exist;
      });

      // Await just not to leave the hanging promise in the test
      await connectPromise;
    });

    it('should show device auth code modal when OIDC flow triggers the notification', async function () {
      const connections = renderHookWithContext();
      let resolveConnect;
      const spy = sinon.stub(connectionsManager, 'connect').returns(
        new Promise((resolve) => {
          resolveConnect = () => resolve(createMockDataService());
        })
      );
      const connectPromise = connections.current.connect(
        createNewConnectionInfo()
      );

      await waitFor(() => {
        expect(spy).to.have.been.calledOnce;
      });

      spy.getCall(0).lastArg.onNotifyOIDCDeviceFlow({
        verificationUrl: 'http://example.com/device-auth',
        userCode: 'ABCabc123',
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Visit the following URL to complete authentication/)
        ).to.exist;

        expect(
          screen.getByRole('link', { name: 'http://example.com/device-auth' })
        ).to.exist;

        expect(screen.getByText('ABCabc123')).to.exist;
      });

      resolveConnect();

      await connectPromise;

      await waitFor(() => {
        expect(() =>
          screen.getByText('Complete authentication in the browser')
        ).to.throw();
      });
    });

    for (const multipleConnectionsEnabled of [true, false]) {
      describe(`when multiple connections ${
        multipleConnectionsEnabled ? 'enabled' : 'disabled'
      }`, function () {
        it('should NOT update existing connection with new props when existing connection is successfull', async function () {
          await preferences.savePreferences({
            enableNewMultipleConnectionSystem: multipleConnectionsEnabled,
          });

          const connections = renderHookWithContext();
          const saveSpy = sinon.spy(mockConnectionStorage, 'save');

          await connections.current.connect({
            ...mockConnections[0],
            favorite: { name: 'foobar' },
          });

          // Only once on success so that we're not updating existing connections if
          // they failed
          expect(saveSpy).to.have.been.calledOnce;
          expect(saveSpy.getCall(0)).to.have.nested.property(
            'args[0].connectionInfo.favorite.name',
            'turtles'
          );
        });

        it('should not update existing connection if connection failed', async function () {
          await preferences.savePreferences({
            enableNewMultipleConnectionSystem: multipleConnectionsEnabled,
          });

          const saveSpy = sinon.spy(mockConnectionStorage, 'save');
          const onConnectionFailed = sinon.spy();
          const connections = renderHookWithContext({ onConnectionFailed });

          sinon
            .stub(connectionsManager, 'connect')
            .rejects(new Error('Failed to connect'));

          await connections.current.connect({
            ...mockConnections[0],
            favorite: { name: 'foobar' },
          });

          expect(onConnectionFailed).to.have.been.calledOnce;
          expect(saveSpy).to.not.have.been.called;
        });
      });
    }
  });

  describe('#disconnect', function () {
    it('disconnect even if connection is in progress cleaning up progress toasts', async function () {
      const connections = renderHookWithContext();

      sinon.spy(connectionsManager, 'closeConnection');

      const connectionInfo = createNewConnectionInfo();
      const connectPromise = connections.current.connect(connectionInfo);

      await waitFor(() => {
        expect(screen.getByText(/Connecting to/)).to.exist;
      });

      await connections.current.disconnect(connectionInfo.id);
      await connectPromise;

      expect(trackSpy).to.have.been.calledWith('Connection Disconnected');
      expect(() => screen.getByText(/Connecting to/)).to.throw;
      expect(connectionsManager).to.have.property('closeConnection').have.been
        .calledOnce;
    });
  });

  describe('#createNewConnection', function () {
    it('should "open" connection form create new connection info for editing every time', function () {
      const connections = renderHookWithContext();

      expect(connections.current.state.isEditingConnectionInfoModalOpen).to.eq(
        false
      );

      connections.current.createNewConnection();
      const conn1 = connections.current.state.editingConnectionInfo;

      expect(connections.current.state.isEditingConnectionInfoModalOpen).to.eq(
        true
      );

      connections.current.createNewConnection();
      const conn2 = connections.current.state.editingConnectionInfo;

      expect(connections.current.state.isEditingConnectionInfoModalOpen).to.eq(
        true
      );

      connections.current.createNewConnection();
      const conn3 = connections.current.state.editingConnectionInfo;

      expect(connections.current.state.isEditingConnectionInfoModalOpen).to.eq(
        true
      );

      expect(conn1).to.not.deep.eq(conn2);
      expect(conn1).to.not.deep.eq(conn3);
    });
  });

  describe('#saveEditedConnection', function () {
    it('new connection: should call save and track the creation', async function () {
      const saveSpy = sinon.spy(mockConnectionStorage, 'save');
      const connections = renderHookWithContext();

      // Waiting for connections to load first
      await waitFor(() => {
        expect(connections.current.favoriteConnections).to.have.lengthOf.gt(0);
      });

      const newConnection = {
        ...createNewConnectionInfo(),
        favorite: {
          name: 'peaches (50) peaches',
        },
        savedConnectionType: 'favorite',
      };

      await connections.current.saveEditedConnection(newConnection);

      expect(saveSpy).to.have.been.calledOnce;
      expect(trackSpy).to.have.been.calledWith('Connection Created');

      await waitFor(() => {
        expect(
          connections.current.favoriteConnections.find((info) => {
            return info.id === newConnection.id;
          })
        ).to.exist;
      });
    });

    it('existing connection: should call save and should not track the creation', async function () {
      const saveSpy = sinon.spy(mockConnectionStorage, 'save');
      const connections = renderHookWithContext();

      // Waiting for connections to load first
      await waitFor(() => {
        expect(connections.current.favoriteConnections).to.have.lengthOf.gt(0);
      });

      const updatedConnection = {
        ...mockConnections[0],
        savedConnectionType: 'recent',
      };

      await connections.current.saveEditedConnection(updatedConnection);

      expect(saveSpy).to.have.been.calledOnce;
      expect(trackSpy).to.have.been.calledWith('Connection Created');

      await waitFor(() => {
        expect(
          connections.current.recentConnections.find((info) => {
            return info.id === updatedConnection.id;
          })
        ).to.exist;
      });
    });
  });

  describe('#removeConnection', function () {
    it('should disconnect and call delete and track the deletion', async function () {
      const deleteSpy = sinon.spy(mockConnectionStorage, 'delete');
      const closeConnectionSpy = sinon.spy(
        connectionsManager,
        'closeConnection'
      );
      const connections = renderHookWithContext();

      // Waiting for connections to load first
      await waitFor(() => {
        expect(connections.current.favoriteConnections).to.have.lengthOf.gt(0);
      });

      await connections.current.removeConnection(mockConnections[0].id);

      expect(closeConnectionSpy).to.have.been.calledOnce;
      expect(trackSpy).to.have.been.calledWith('Connection Removed');
      expect(deleteSpy).to.have.been.calledOnce;
      expect(trackSpy).to.have.been.calledWith('Connection Disconnected');

      await waitFor(() => {
        expect(
          connections.current.favoriteConnections.find((info) => {
            return info.id === mockConnections[0].id;
          })
        ).not.to.exist;
      });
    });
  });

  describe('#editConnection', function () {
    it('should only allow to edit existing connections', async function () {
      const connections = renderHookWithContext();

      // Waiting for connections to load first
      await waitFor(() => {
        expect(connections.current.favoriteConnections).to.have.lengthOf.gt(0);
      });

      connections.current.editConnection('123');
      expect(connections.current.state).to.have.property(
        'isEditingConnectionInfoModalOpen',
        false
      );

      connections.current.editConnection(mockConnections[0].id);
      expect(connections.current.state).to.have.property(
        'isEditingConnectionInfoModalOpen',
        true
      );
      expect(connections.current.state).to.have.property(
        'editingConnectionInfo',
        mockConnections[0]
      );
    });
  });

  describe('#duplicateConnection', function () {
    it('should copy connection and add a copy number at the end', async function () {
      const connections = renderHookWithContext();

      for (let i = 0; i <= 30; i++) {
        await connections.current.duplicateConnection(mockConnections[1].id, {
          autoDuplicate: true,
        });
      }

      expect(
        connections.current.favoriteConnections.find((info) => {
          return info.favorite.name === 'peaches (30)';
        })
      ).to.exist;
    });

    it('should create a name if there is none', async function () {
      const connectionWithoutName: ConnectionInfo = {
        id: '123',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
        favorite: {
          name: '',
          color: 'color2',
        },
        savedConnectionType: 'recent',
      };
      mockConnectionStorage = new InMemoryConnectionStorage([
        connectionWithoutName,
      ]);
      const connections = renderHookWithContext();

      // Waiting for connections to load first
      await waitFor(() => {
        expect(connections.current.recentConnections).to.have.lengthOf.gt(0);
      });

      await connections.current.duplicateConnection(connectionWithoutName.id, {
        autoDuplicate: true,
      });

      await waitFor(() => {
        expect(
          connections.current.recentConnections.find((info) => {
            return info.favorite.name === 'localhost:27017 (1)';
          })
        ).to.exist.and.to.have.nested.property('favorite.color', 'color2');
      });
    });

    it('should only look for copy number at the end of the connection name', async function () {
      const connections = renderHookWithContext();

      const newConnection = {
        ...createNewConnectionInfo(),
        favorite: {
          name: 'peaches (50) peaches',
        },
        savedConnectionType: 'favorite',
      };

      await connections.current.saveEditedConnection(newConnection);

      await waitFor(() => {
        expect(
          connections.current.favoriteConnections.find((info) => {
            return info.id === newConnection.id;
          })
        ).to.exist;
      });

      await connections.current.duplicateConnection(newConnection.id, {
        autoDuplicate: true,
      });

      await waitFor(() => {
        expect(
          connections.current.favoriteConnections.find((info) => {
            return info.favorite.name === 'peaches (50) peaches (1)';
          })
        ).to.exist;
      });
    });
  });
});
