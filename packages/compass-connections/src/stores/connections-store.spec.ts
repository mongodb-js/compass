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
  type ConnectionProvider,
  DesktopConnectionProvider,
} from '@mongodb-js/connection-storage/main';

const noop = (): any => {
  /* no-op */
};

const mockConnections = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    userFavorite: true,
    name: 'turtles',
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    userFavorite: true,
    name: 'peaches',
  },
];

describe('use-connections hook', function () {
  let connectionProvider: ConnectionProvider;
  let mockConnectionStorage: ConnectionStorage;
  let loadAllSpy: sinon.SinonSpy;
  let saveSpy: sinon.SinonSpy;
  let deleteSpy: sinon.SinonSpy;
  let loadSpy: sinon.SinonSpy;
  let renderHookWithContext: typeof renderHook;

  before(async function () {
    const preferences = await createSandboxFromDefaultPreferences();
    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(PreferencesProvider, { children, value: preferences });
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

    connectionProvider = new DesktopConnectionProvider(mockConnectionStorage);
  });

  afterEach(cleanup);

  describe('#loadConnections', function () {
    it('loads the connections from the connection storage', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          connectionProvider,
          connectFn: noop,
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
        { id: '1', userFavorite: true, name: 'bcd', connectionOptions },
        { id: '2', lastUsed: new Date(), connectionOptions },
        { id: '3', userFavorite: true, name: 'abc', connectionOptions },
      ]);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          connectionProvider,
          connectFn: noop,
          appName: 'Test App Name',
        })
      );

      // Wait for the async loading of connections to complete.
      await waitFor(() =>
        expect(result.current.favoriteConnections).to.deep.equal([
          {
            id: '3',
            userFavorite: true,
            name: 'abc',
            status: 'disconnected',
            connectionOptions,
          },
          {
            id: '1',
            userFavorite: true,
            name: 'bcd',
            status: 'disconnected',
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
        { id: '1', userFavorite: true, name: 'bcd', connectionOptions },
        {
          id: '2',
          userFavorite: false,
          name: '2',
          lastUsed: new Date(1647020087550),
          connectionOptions,
        },
        { id: '3', userFavorite: true, name: 'abc', connectionOptions },
        { id: '4', userFavorite: false, name: '4', connectionOptions }, // very old recent connection without lastUsed
        {
          id: '5',
          userFavorite: false,
          name: '5',
          lastUsed: new Date(1647020087551),
          connectionOptions,
        },
      ]);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          connectionProvider,
          connectFn: noop,
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
          userFavorite: false,
          name: '2',
          status: 'disconnected',
          lastUsed: new Date(1647020087550),
          connectionOptions,
        },
        {
          id: '4',
          name: '4',
          userFavorite: false,
          status: 'disconnected',
          connectionOptions,
        },
        {
          id: '5',
          userFavorite: false,
          name: '5',
          status: 'disconnected',
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
          connectionProvider,
          connectFn: () => Promise.resolve({} as any),
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

    it('allows connecting to a dynamically provided connection info object', async function () {
      const onConnected = sinon.spy();
      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected,
          connectionProvider,
          connectFn: () => Promise.resolve({} as any),
          appName: 'Test App Name',
        })
      );

      await result.current.connect(() =>
        Promise.resolve({
          id: 'new',
          connectionOptions: {
            connectionString: 'mongodb://new-recent',
          },
        })
      );

      await waitFor(() => {
        expect(onConnected).to.have.been.called;
      });
      expect(saveSpy).to.not.have.been.called;
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
            connectionProvider,
            connectFn: noop,
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
            userFavorite: true,
            name: 'not peaches',
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
          userFavorite: true,
          name: 'not peaches',
          status: 'disconnected',
        });
      });

      it('clones the existing connection when it is updated', function () {
        expect(hookResult.current.favoriteConnections[0]).to.not.equal(
          mockConnections[1]
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
            connectionProvider,
            connectFn: noop,
            appName: 'Test App Name',
          })
        );

        await act(async () => {
          await result.current.saveConnection({
            id: 'pineapples',
            connectionOptions: {
              connectionString: 'mongodb://bacon',
            },
            userFavorite: true,
            name: 'bacon',
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
            connectionProvider,
            connectFn: noop,
            appName: 'Test App Name',
          })
        );

        await act(async () => {
          await result.current.saveConnection({
            id: 'pineapples',
            connectionOptions: {
              connectionString: 'bacon',
            },
            userFavorite: true,
            name: 'bacon',
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
            connectionProvider,
            connectFn: noop,
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
            userFavorite: true,
            name: 'snakes! ah!',
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
          userFavorite: true,
          name: 'snakes! ah!',
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
          userFavorite: true,
          name: 'Dolphin',
        },
        {
          id: 'turtle',
          connectionOptions: {
            connectionString: '',
          },
          userFavorite: false,
          name: 'turtle',
        },
        {
          id: 'oranges',
          connectionOptions: {
            connectionString: '',
          },
          userFavorite: false,
          name: 'oranges',
        },
      ];
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          connectionProvider,
          connectFn: noop,
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
          connectionProvider,
          connectFn: noop,
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
          connectionProvider,
          connectFn: noop,
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
          userFavorite: true,
          name: 'turtles',
        },
        {
          id: 'oranges',
          connectionOptions: {
            connectionString: 'mongodb://peaches',
          },
          userFavorite: true,
          name: 'peaches',
        },
      ];
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHookWithContext(() =>
        useConnections({
          onConnected: noop,
          connectionProvider,
          connectFn: noop,
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
