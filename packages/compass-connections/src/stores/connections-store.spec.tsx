import { promisify } from 'util';
import { expect } from 'chai';
import { waitFor, cleanup, screen, render } from '@testing-library/react';
import sinon from 'sinon';
import { createNewConnectionInfo } from './connections-store';
import {
  createSandboxFromDefaultPreferences,
  PreferencesAccess,
} from 'compass-preferences-model';
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

const noop = (): any => {
  /* no-op */
};

function getConnectionsManager(mockTestConnectFn?: typeof connect) {
  const { log } = createNoopLogger();
  return new ConnectionsManager({
    logger: log.unbound,
    __TEST_CONNECT_FN: mockTestConnectFn,
  });
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

describe('useConnections hook', function () {
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: ConnectionStorage;
  let preferences: PreferencesAccess;
  let renderHookWithContext: (
    props?: ComponentProps<typeof ConnectionsProvider>
  ) => ReturnType<typeof useConnections>;

  before(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableNewMultipleConnectionSystem: true,
    });
    renderHookWithContext = (props) => {
      const wrapper: React.FC = ({ children }) => {
        return (
          <ToastArea>
            <ConfirmationModalArea>
              <PreferencesProvider value={preferences}>
                <ConnectionStorageProvider value={mockConnectionStorage}>
                  <ConnectionsManagerProvider value={connectionsManager}>
                    <ConnectionsProvider {...props}>
                      {children}
                    </ConnectionsProvider>
                  </ConnectionsManagerProvider>
                </ConnectionStorageProvider>
              </PreferencesProvider>
            </ConfirmationModalArea>
          </ToastArea>
        );
      };
      let hookResult: ReturnType<typeof useConnections>;
      const UseConnections = () => {
        hookResult = useConnections();
        return null;
      };
      render(<UseConnections></UseConnections>, { wrapper });
      return hookResult!;
    };
  });

  beforeEach(function () {
    mockConnectionStorage = new InMemoryConnectionStorage(mockConnections);
    connectionsManager = getConnectionsManager(async () => {
      await promisify(setTimeout)(200);
      return {
        mockDataService: 'yes',
        addReauthenticationHandler() {},
        getUpdatedSecrets() {
          return Promise.resolve({});
        },
      } as unknown as DataService;
    });
  });

  afterEach(() => {
    cleanup();
    sinon.restore();
  });

  it('autoconnects on mount and does not save autoconnect info', async function () {
    const onConnected = sinon.spy();
    sinon.stub(mockConnectionStorage, 'getAutoConnectInfo').resolves({
      id: 'new',
      connectionOptions: {
        connectionString: 'mongodb://new-recent',
      },
    });
    const saveSpy = sinon.spy(mockConnectionStorage, 'save');

    renderHookWithContext({ onConnected });

    await waitFor(() => {
      expect(onConnected).to.have.been.called;
    });

    // autoconnect info should never be saved
    expect(saveSpy).to.not.have.been.called;
  });

  describe.only('#connect', function () {
    it('should show notifications throughout connection flow and save connection on disk', async function () {
      const onConnectionAttemptStarted = sinon.spy();
      const onConnected = sinon.spy();
      const connections = renderHookWithContext({
        onConnectionAttemptStarted,
        onConnected,
      });
      const saveSpy = sinon.spy(mockConnectionStorage, 'save');

      const connectionInfo = createNewConnectionInfo();
      const connectPromise = connections.connect(connectionInfo);

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

    describe('saving connections in single connection mode', function () {
      it('should update existing connection with new props when connection is successfull', async function () {
        await preferences.savePreferences({
          enableNewMultipleConnectionSystem: false,
        });

        const connections = renderHookWithContext();
        const saveSpy = sinon.spy(mockConnectionStorage, 'save');

        await connections.connect({
          ...mockConnections[0],
          favorite: { name: 'foobar' },
        });

        // Only once on success so that we're not updating existing connections if
        // they failed
        expect(saveSpy).to.have.been.calledOnce;
        expect(saveSpy.getCall(0)).to.have.nested.property(
          'args[0].connectionInfo.favorite.name',
          'foobar'
        );
      });

      it('should not update existing connection if connection failed', async function () {
        await preferences.savePreferences({
          enableNewMultipleConnectionSystem: false,
        });

        const saveSpy = sinon.spy(mockConnectionStorage, 'save');
        const onConnectionFailed = sinon.spy();
        const connections = renderHookWithContext({ onConnectionFailed });

        sinon
          .stub(connectionsManager, 'connect')
          .rejects(new Error('Failed to connect'));

        await connections.connect({
          ...mockConnections[0],
          favorite: { name: 'foobar' },
        });

        expect(onConnectionFailed).to.have.been.called;
        expect(saveSpy).to.not.have.been.called;
      });
    });

    describe('saving connections in multiple connections mode', function () {
      it('should always update existing connection even if conneciton will fail', async function () {
        const saveSpy = sinon.spy(mockConnectionStorage, 'save');
        const onConnectionFailed = sinon.spy();
        const connections = renderHookWithContext({ onConnectionFailed });

        sinon
          .stub(connectionsManager, 'connect')
          .rejects(new Error('Failed to connect'));

        await connections.connect({
          ...mockConnections[0],
          connectionOptions: {
            connectionString: 'mongodb://super-broken-new-url',
          },
        });

        expect(onConnectionFailed).to.have.been.called;
        expect(saveSpy).to.have.been.called;
      });
    });
  });

  describe('#saveConnection', function () {
    describe('with an existing connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      let saveSpy: sinon.SinonSpy;
      beforeEach(async function () {
        saveSpy = sinon.spy(mockConnectionStorage, 'save');

        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            onConnectionFailed: noop,
            onConnectionAttemptStarted: noop,
          })
        );

        // Wait for the async loading of connections to complete.
        await waitFor(() =>
          expect(result.current.favoriteConnections.length).to.equal(2)
        );

        await act(async () => {
          await result.current.saveConnection({
            id: 'oranges',
            connectionOptions: {
              connectionString: 'mongodb://aba',
            },
            savedConnectionType: 'favorite',
            favorite: {
              name: 'not peaches',
            },
          });
        });

        hookResult = result;
      });

      it('calls to save a connection on the store', function () {
        expect(saveSpy.callCount).to.equal(1);
      });

      it('updates the existing entry on the connections list', function () {
        expect(hookResult.current.favoriteConnections.length).to.equal(2);
        expect(hookResult.current.favoriteConnections[0]).to.deep.equal({
          id: 'oranges',
          connectionOptions: {
            connectionString: 'mongodb://aba',
          },
          savedConnectionType: 'favorite',
          favorite: {
            name: 'not peaches',
          },
        });
      });

      it('clones the existing connection when it is updated', function () {
        expect(hookResult.current.favoriteConnections[0]).to.not.equal(
          hookResult.current.favoriteConnections[1]
        );
        expect(
          hookResult.current.favoriteConnections[0].connectionOptions
        ).to.not.equal(mockConnections[0].connectionOptions);
      });
    });

    describe('saving a new connection', function () {
      let saveSpy: sinon.SinonSpy;
      beforeEach(async function () {
        saveSpy = sinon.spy(mockConnectionStorage, 'save');
        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            onConnectionFailed: noop,
            onConnectionAttemptStarted: noop,
          })
        );

        await act(async () => {
          await result.current.saveConnection({
            id: 'pineapples',
            connectionOptions: {
              connectionString: 'mongodb://bacon',
            },
            savedConnectionType: 'favorite',
            favorite: {
              name: 'bacon',
            },
          });
        });
      });

      it('calls to save a connection on the store', function () {
        expect(saveSpy.callCount).to.equal(1);
      });
    });

    describe('saving an invalid connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      let saveSpy: sinon.SinonSpy;
      beforeEach(async function () {
        mockConnectionStorage = new InMemoryConnectionStorage([]);
        saveSpy = sinon.spy(mockConnectionStorage, 'save');
        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            onConnectionFailed: noop,
            onConnectionAttemptStarted: noop,
          })
        );

        await act(async () => {
          await result.current.saveConnection({
            id: 'pineapples',
            connectionOptions: {
              connectionString: 'bacon',
            },
            savedConnectionType: 'favorite',
            favorite: {
              name: 'bacon',
            },
          });
        });

        hookResult = result;
      });

      it('does not call to save a connection on the store', function () {
        expect(saveSpy.callCount).to.equal(0);
      });

      it('does not add the new connection to the current connections list', function () {
        expect(hookResult.current.favoriteConnections).to.be.deep.equal([]);
      });
    });

    describe('state reactivity', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;

      beforeEach(function () {
        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            onConnectionFailed: noop,
            onConnectionAttemptStarted: noop,
          })
        );

        hookResult = result;
      });

      it('should update connections when received a change event', async function () {
        const loadAllSpyWithData = sinon.fake.resolves([
          {
            id: '1',
            savedConnectionType: 'favorite',
            favorite: { name: 'bcd' },
            connectionOptions: {},
          },
        ]);

        mockConnectionStorage.loadAll = loadAllSpyWithData;
        mockConnectionStorage.emit('ConnectionsChanged');

        await waitFor(() => expect(loadAllSpyWithData).to.have.been.called);

        expect(hookResult.current.favoriteConnections.length).to.equal(1);
      });
    });

    describe('saving the current active connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            onConnectionFailed: noop,
            onConnectionAttemptStarted: noop,
          })
        );

        // Wait for the async loading of connections to complete.
        await waitFor(() => {
          return expect(result.current.favoriteConnections.length).to.equal(2);
        });

        // Make the first connection the active connection.
        act(() => {
          result.current.setActiveConnectionById('turtle');
        });

        await act(async () => {
          await result.current.saveConnection({
            id: 'turtle',
            connectionOptions: {
              connectionString: 'mongodb://nice',
            },
            savedConnectionType: 'favorite',
            favorite: {
              name: 'snakes! ah!',
            },
          });
        });

        hookResult = result;
      });

      it('updates the current active connection with the new info', function () {
        expect(hookResult.current.state.activeConnectionId).to.equal('turtle');
        expect(hookResult.current.state.activeConnectionInfo).to.deep.equal({
          id: 'turtle',
          connectionOptions: {
            connectionString: 'mongodb://nice',
          },
          savedConnectionType: 'favorite',
          favorite: {
            name: 'snakes! ah!',
          },
        });
      });
    });
  });

  describe('#removeAllRecentsConnections', function () {
    it('should delete all recent connections', async function () {
      mockConnectionStorage = new InMemoryConnectionStorage([
        {
          id: 'dolphin',
          connectionOptions: {
            connectionString: '',
          },
          savedConnectionType: 'favorite',
          favorite: {
            name: 'Dolphin',
          },
        },
        {
          id: 'turtle',
          connectionOptions: {
            connectionString: '',
          },
          savedConnectionType: 'recent',
          favorite: {
            name: 'turtle',
          },
        },
        {
          id: 'oranges',
          connectionOptions: {
            connectionString: '',
          },
          savedConnectionType: 'recent',
          favorite: {
            name: 'oranges',
          },
        },
      ]);
      const loadAllSpy = sinon.spy(mockConnectionStorage, 'loadAll');
      const deleteSpy = sinon.spy(mockConnectionStorage, 'delete');

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(1);
        expect(result.current.recentConnections.length).to.equal(2);
      });
      await result.current.removeAllRecentsConnections();

      expect(loadAllSpy).to.have.been.called;
      expect(deleteSpy.callCount).to.equal(2);
    });
  });

  describe('createDuplicateConnection', function () {
    it('should create a connection duplicate and set it as the new active connection', async function () {
      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(2);
      });

      const original = result.current.favoriteConnections[0];
      result.current.createDuplicateConnection(original);

      const duplicate = result.current.state.activeConnectionInfo;

      expect(duplicate).to.haveOwnProperty('id');
      expect(duplicate.id).not.to.equal(original.id);
      expect(result.current.state.activeConnectionId).to.equal(duplicate.id);
      delete original.id;
      delete duplicate.id;
      expect(duplicate).to.deep.equal({
        ...original,
        favorite: {
          ...original.favorite,
          name: `${original.favorite.name} (1)`,
        },
      });
    });

    it('should increment (number) appendix', async function () {
      mockConnectionStorage = new InMemoryConnectionStorage([
        mockConnections[0],
        {
          ...mockConnections[0],
          favorite: {
            ...mockConnections[0].favorite,
            name: `${mockConnections[0].favorite.name} (1)`,
          },
        },
      ]);
      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(2);
      });

      const original = result.current.favoriteConnections[0]; // copying the original
      result.current.createDuplicateConnection(original);
      const duplicate = result.current.state.activeConnectionInfo;
      expect(duplicate.favorite.name).to.equal(`${original.favorite.name} (2)`);

      const copy = result.current.favoriteConnections[1]; // copying the copy
      result.current.createDuplicateConnection(copy);
      const duplicate2 = result.current.state.activeConnectionInfo;
      expect(duplicate2.favorite.name).to.equal(
        `${original.favorite.name} (2)`
      );
    });
  });

  describe('#removeConnection', function () {
    let hookResult: RenderResult<ReturnType<typeof useConnections>>;
    it('should remove a connection', async function () {
      const loadAllSpy = sinon.spy(mockConnectionStorage, 'loadAll');
      const deleteSpy = sinon.spy(mockConnectionStorage, 'delete');

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(2);
      });
      act(() => {
        result.current.setActiveConnectionById('turtle');
      });
      void result.current.removeConnection(
        result.current.favoriteConnections[1]
      );

      expect(loadAllSpy).to.have.been.called;
      expect(deleteSpy.callCount).to.equal(1);
      hookResult = result;
    });
    it('should set a new connection as current active connection', function () {
      expect(hookResult.current.state.activeConnectionId).not.undefined;
      expect(
        hookResult.current.state.activeConnectionInfo.connectionOptions
          .connectionString
      ).equal('mongodb://localhost:27017');
    });
  });

  describe('#createNewConnection', function () {
    it('should create a connection', async function () {
      mockConnectionStorage = new InMemoryConnectionStorage([
        {
          id: 'turtle',
          connectionOptions: {
            connectionString: 'mongodb://turtle',
          },
          savedConnectionType: 'favorite',
          favorite: {
            name: 'turtles',
          },
        },
        {
          id: 'oranges',
          connectionOptions: {
            connectionString: 'mongodb://peaches',
          },
          savedConnectionType: 'favorite',
          favorite: {
            name: 'peaches',
          },
        },
      ]);
      const loadAllSpy = sinon.spy(mockConnectionStorage, 'loadAll');

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(2);
      });
      act(() => {
        result.current.setActiveConnectionById('turtle');
      });
      expect(loadAllSpy).to.have.been.called;
      result.current.createNewConnection();
      expect(result.current.state.activeConnectionId).not.undefined;
      expect(
        result.current.state.activeConnectionInfo.connectionOptions
          .connectionString
      ).equal('mongodb://localhost:27017');
    });
  });
});
