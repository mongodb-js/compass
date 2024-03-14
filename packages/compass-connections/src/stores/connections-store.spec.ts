import { expect } from 'chai';
import { waitFor, cleanup } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react-hooks';
import { renderHook, act } from '@testing-library/react-hooks';
import sinon from 'sinon';

import { useConnections } from './connections-store';
import type { ConnectionStorage } from '@mongodb-js/connection-storage/renderer';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createElement } from 'react';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import {
  ConnectionRepository,
  type ConnectionInfo,
} from '@mongodb-js/connection-storage/main';

import { ConnectionRepositoryContext } from '@mongodb-js/connection-storage/provider';
import { ConnectionsManager, ConnectionsManagerProvider } from '../provider';
import type { DataService, connect } from 'mongodb-data-service';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

const noop = (): any => {
  /* no-op */
};

function getConnectionsManager(mockTestConnectFn?: typeof connect) {
  const { log } = createNoopLoggerAndTelemetry();
  return new ConnectionsManager(log.unbound, () => {}, mockTestConnectFn);
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
  let connectionRepository: ConnectionRepository;
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: typeof ConnectionStorage;
  let loadAllSpy: sinon.SinonSpy;
  let saveSpy: sinon.SinonSpy;
  let deleteSpy: sinon.SinonSpy;
  let loadSpy: sinon.SinonSpy;
  let renderHookWithContext: typeof renderHook;

  before(async function () {
    const preferences = await createSandboxFromDefaultPreferences();
    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(PreferencesProvider, {
          value: preferences,
          children: [
            createElement(ConnectionRepositoryContext.Provider, {
              value: connectionRepository,
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
    loadAllSpy = sinon.spy();
    saveSpy = sinon.spy();
    deleteSpy = sinon.spy();
    loadSpy = sinon.spy();

    mockConnectionStorage = {
      loadAll: loadAllSpy,
      save: saveSpy,
      delete: deleteSpy,
      load: loadSpy,
    };

    connectionRepository = new ConnectionRepository(mockConnectionStorage);
    connectionsManager = getConnectionsManager(() =>
      Promise.resolve({
        mockDataService: 'yes',
        addReauthenticationHandler() {},
      } as unknown as DataService)
    );
  });

  afterEach(cleanup);

  describe('#loadConnections', function () {
    it('loads the connections from the connection storage', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          appName: 'Test App Name',
        })
      );

      // Wait for the async loading of connections to complete.
      await waitFor(() =>
        expect(result.current.state.favoriteConnections.length).to.equal(2)
      );

      expect(loadAllSpyWithData).to.have.been.called;
    });

    it('filters and sort favorites connections', async function () {
      const connectionOptions = {
        connectionString: 'mongodb://turtle',
      };
      const loadAllSpyWithData = sinon.fake.resolves([
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
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          appName: 'Test App Name',
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
      const loadAllSpyWithData = sinon.fake.resolves([
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
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          appName: 'Test App Name',
        })
      );

      await waitFor(() => {
        expect(result.current.state.favoriteConnections.length).to.equal(2);
        expect(result.current.state.recentConnections.length).to.equal(3);
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
          connectionRepository,
          appName: 'Test App Name',
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
      expect(saveSpy).to.have.been.calledOnce;
    });
  });

  describe('#saveConnection', function () {
    describe('with an existing connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        mockConnectionStorage.loadAll = () => Promise.resolve(mockConnections);
        mockConnectionStorage.load = () => Promise.resolve(mockConnections[1]);

        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            appName: 'Test App Name',
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
      beforeEach(async function () {
        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            appName: 'Test App Name',
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
      beforeEach(async function () {
        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            appName: 'Test App Name',
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

      it('calls to save a connection on the store', function () {
        expect(saveSpy.callCount).to.equal(0);
      });

      it('does not add the new connection to the current connections list', function () {
        expect(hookResult.current.favoriteConnections).to.be.deep.equal([]);
      });
    });

    describe('saving the current active connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        mockConnectionStorage.loadAll = () => Promise.resolve(mockConnections);

        const { result } = renderHookWithContext(() =>
          useConnections({
            onConnected: noop,
            appName: 'Test App Name',
          })
        );

        // Wait for the async loading of connections to complete.
        await waitFor(() =>
          expect(result.current.favoriteConnections.length).to.equal(2)
        );

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
      const mockConnections = [
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
      ];
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(1);
        expect(result.current.recentConnections.length).to.equal(2);
      });
      await result.current.removeAllRecentsConnections();

      expect(loadAllSpyWithData).to.have.been.called;
      expect(deleteSpy.callCount).to.equal(2);
    });
  });
  describe('#duplicateConnection', function () {
    let hookResult: RenderResult<ReturnType<typeof useConnections>>;

    it('should duplicate a connection', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(2);
      });

      result.current.setActiveConnectionById('turtle');
      result.current.duplicateConnection(result.current.favoriteConnections[0]);

      await waitFor(() => {
        expect(loadAllSpyWithData).to.have.been.called;
        expect(saveSpy.callCount).to.equal(1);
      });

      hookResult = result;
    });

    it('should set the duplicated connection as current active', function () {
      expect(hookResult.current.state.activeConnectionId).to.not.equal(null);
    });
  });
  describe('#removeConnection', function () {
    let hookResult: RenderResult<ReturnType<typeof useConnections>>;
    it('should remove a connection', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(2);
      });
      act(() => {
        result.current.setActiveConnectionById('turtle');
      });
      result.current.removeConnection(result.current.favoriteConnections[1]);

      expect(loadAllSpyWithData).to.have.been.called;
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
      const mockConnections = [
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
      ];
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.favoriteConnections.length).to.equal(2);
      });
      act(() => {
        result.current.setActiveConnectionById('turtle');
      });
      expect(loadAllSpyWithData).to.have.been.called;
      result.current.createNewConnection();
      expect(result.current.state.activeConnectionId).not.undefined;
      expect(
        result.current.state.activeConnectionInfo.connectionOptions
          .connectionString
      ).equal('mongodb://localhost:27017');
    });
  });
});
