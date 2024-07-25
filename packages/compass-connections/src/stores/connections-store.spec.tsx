import { expect } from 'chai';
import { waitFor, cleanup } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react-hooks';
import { renderHook, act } from '@testing-library/react-hooks';
import sinon from 'sinon';

import { useConnections } from './connections-store';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createElement } from 'react';
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

describe('use-connections hook', function () {
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: ConnectionStorage;
  let renderHookWithContext: typeof renderHook;

  before(async function () {
    const preferences = await createSandboxFromDefaultPreferences();
    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(PreferencesProvider, {
          value: preferences,
          children: [
            createElement(ConnectionStorageProvider, {
              value: mockConnectionStorage,
              children: [
                createElement(ConnectionsManagerProvider, {
                  value: connectionsManager,
                  children,
                }),
              ],
            }),
          ],
        });

      return renderHook(callback, { wrapper, ...options });
    };
    await preferences.savePreferences({ persistOIDCTokens: false });
  });

  beforeEach(function () {
    mockConnectionStorage = new InMemoryConnectionStorage(mockConnections);
    connectionsManager = getConnectionsManager(() =>
      Promise.resolve({
        mockDataService: 'yes',
        addReauthenticationHandler() {},
      } as unknown as DataService)
    );
  });

  afterEach(() => {
    cleanup();
    sinon.restore();
  });

  describe('#onMount', function () {
    it('allows connecting to a dynamically provided connection info object', async function () {
      const onConnected = sinon.spy();
      sinon.stub(mockConnectionStorage, 'getAutoConnectInfo').resolves({
        id: 'new',
        connectionOptions: {
          connectionString: 'mongodb://new-recent',
        },
      });
      const saveSpy = sinon.spy(mockConnectionStorage, 'save');
      renderHookWithContext(() =>
        useConnections({
          onConnected,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );

      await waitFor(() => {
        expect(onConnected).to.have.been.called;
      });
      expect(saveSpy).to.not.have.been.called;
    });
  });

  describe('#loadConnections', function () {
    it('loads the connections from the connection storage', async function () {
      const loadAllSpy = sinon.spy(mockConnectionStorage, 'loadAll');

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

      expect(loadAllSpy).to.have.been.called;
    });

    it('filters and sort favorites connections', async function () {
      const connectionOptions = {
        connectionString: 'mongodb://turtle',
      };
      mockConnectionStorage = new InMemoryConnectionStorage([
        {
          id: '1',
          savedConnectionType: 'favorite',
          favorite: { name: 'bcd' },
          connectionOptions,
        },
        { id: '2', lastUsed: new Date(), connectionOptions },
        {
          id: '3',
          savedConnectionType: 'favorite',
          favorite: { name: 'abc' },
          connectionOptions,
        },
      ]);

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );

      // Wait for the async loading of connections to complete.
      await waitFor(() =>
        expect(result.current.favoriteConnections).to.deep.equal([
          {
            id: '3',
            favorite: {
              name: 'abc',
            },
            savedConnectionType: 'favorite',
            connectionOptions,
          },
          {
            id: '1',
            favorite: {
              name: 'bcd',
            },
            savedConnectionType: 'favorite',
            connectionOptions,
          },
        ])
      );
    });

    it('filters and sort recents connections', async function () {
      const connectionOptions = {
        connectionString: 'mongodb://turtle',
      };
      mockConnectionStorage = new InMemoryConnectionStorage([
        {
          id: '1',
          savedConnectionType: 'favorite',
          favorite: { name: 'bcd' },
          connectionOptions,
        },
        {
          id: '2',
          savedConnectionType: 'recent',
          favorite: { name: '2' },
          lastUsed: new Date(1647020087550),
          connectionOptions,
        },
        {
          id: '3',
          savedConnectionType: 'favorite',
          favorite: { name: 'abc' },
          connectionOptions,
        },
        {
          id: '4',
          savedConnectionType: 'recent',
          favorite: { name: '4' },
          connectionOptions,
        }, // very old recent connection without lastUsed
        {
          id: '5',
          savedConnectionType: 'recent',
          favorite: { name: '5' },
          lastUsed: new Date(1647020087551),
          connectionOptions,
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
        expect(result.current.recentConnections.length).to.equal(3);
      });

      expect(result.current.recentConnections).to.deep.equal([
        {
          id: '2',
          savedConnectionType: 'recent',
          favorite: { name: '2' },
          lastUsed: new Date(1647020087550),
          connectionOptions,
        },
        {
          id: '4',
          savedConnectionType: 'recent',
          favorite: { name: '4' },
          connectionOptions,
        },
        {
          id: '5',
          savedConnectionType: 'recent',
          favorite: { name: '5' },
          lastUsed: new Date(1647020087551),
          connectionOptions,
        },
      ]);
    });
  });

  describe('#connect', function () {
    it(`calls onConnected`, async function () {
      const onConnected = sinon.spy();
      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected,
          onConnectionFailed: noop,
          onConnectionAttemptStarted: noop,
        })
      );

      await result.current.connect({
        id: 'new',
        connectionOptions: {
          connectionString: 'mongodb://new-recent',
        },
      });

      await waitFor(() => {
        expect(onConnected).to.have.been.called;
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
