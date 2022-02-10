import { expect } from 'chai';
import { waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react-hooks';
import { renderHook, act } from '@testing-library/react-hooks';
import sinon from 'sinon';

import type { ConnectionStore } from './connections-store';
import { useConnections } from './connections-store';

const noop = (): any => {
  /* no-op */
};

const mockConnections = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    favorite: {
      name: 'turtles',
    },
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    favorite: {
      name: 'peaches',
    },
  },
];

describe('use-connections hook', function () {
  let mockConnectionStorage: ConnectionStore;
  let loadAllSpy: sinon.SinonSpy;
  let saveSpy: sinon.SinonSpy;
  let deleteSpy: sinon.SinonSpy;

  beforeEach(function () {
    loadAllSpy = sinon.spy();
    saveSpy = sinon.spy();
    deleteSpy = sinon.spy();

    mockConnectionStorage = {
      loadAll: loadAllSpy,
      save: saveSpy,
      delete: deleteSpy,
    };
  });

  describe('#loadConnections', function () {
    it('loads the connections from the connection storage', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHook(() =>
        useConnections({
          onConnected: noop,
          connectionStorage: mockConnectionStorage,
          connectFn: noop,
          appName: 'Test App Name',
        })
      );

      // Wait for the async loading of connections to complete.
      await waitFor(() =>
        expect(result.current.state.connections.length).to.equal(2)
      );

      expect(loadAllSpyWithData.callCount).to.equal(1);
      expect(result.current.state.connections.length).to.equal(2);
    });
  });

  describe('#saveConnection', function () {
    describe('with an existing connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        mockConnectionStorage.loadAll = () => Promise.resolve(mockConnections);

        const { result } = renderHook(() =>
          useConnections({
            onConnected: noop,
            connectionStorage: mockConnectionStorage,
            connectFn: noop,
            appName: 'Test App Name',
          })
        );

        // Wait for the async loading of connections to complete.
        await waitFor(() =>
          expect(result.current.state.connections.length).to.equal(2)
        );

        await act(async () => {
          await result.current.saveConnection({
            id: 'oranges',
            connectionOptions: {
              connectionString: 'aba',
            },
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
        expect(hookResult.current.state.connections.length).to.equal(2);
        expect(hookResult.current.state.connections[1]).to.deep.equal({
          id: 'oranges',
          connectionOptions: {
            connectionString: 'aba',
          },
          favorite: {
            name: 'not peaches',
          },
        });
      });

      it('clones the existing connection when it is updated', function () {
        expect(hookResult.current.state.connections[1]).to.not.equal(
          mockConnections[1]
        );
        expect(
          hookResult.current.state.connections[1].connectionOptions
        ).to.not.equal(mockConnections[1].connectionOptions);
      });
    });

    describe('saving a new connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        const { result } = renderHook(() =>
          useConnections({
            onConnected: noop,
            connectionStorage: mockConnectionStorage,
            connectFn: noop,
            appName: 'Test App Name',
          })
        );

        await act(async () => {
          await result.current.saveConnection({
            id: 'pineapples',
            connectionOptions: {
              connectionString: '',
            },
            favorite: {
              name: 'bacon',
            },
          });
        });

        hookResult = result;
      });

      it('calls to save a connection on the store', function () {
        expect(saveSpy.callCount).to.equal(1);
      });

      it('adds the new connection to the current connections list', function () {
        expect(hookResult.current.state.connections.length).to.equal(1);
        expect(hookResult.current.state.connections[0]).to.deep.equal({
          id: 'pineapples',
          connectionOptions: {
            connectionString: '',
          },
          favorite: {
            name: 'bacon',
          },
        });
      });
    });

    describe('saving the current active connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        mockConnectionStorage.loadAll = () => Promise.resolve(mockConnections);

        const { result } = renderHook(() =>
          useConnections({
            onConnected: noop,
            connectionStorage: mockConnectionStorage,
            connectFn: noop,
            appName: 'Test App Name',
          })
        );

        // Wait for the async loading of connections to complete.
        await waitFor(() =>
          expect(result.current.state.connections.length).to.equal(2)
        );

        // Make the first connection the active connection.
        act(() => {
          result.current.setActiveConnectionById('turtle');
        });

        await act(async () => {
          await result.current.saveConnection({
            id: 'turtle',
            connectionOptions: {
              connectionString: 'nice',
            },
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
            connectionString: 'nice',
          },
          favorite: {
            name: 'snakes! ah!',
          },
        });
      });

      it('updates the existing entry on the connections list', function () {
        expect(hookResult.current.state.connections.length).to.equal(2);
        expect(hookResult.current.state.connections[0]).to.deep.equal({
          id: 'turtle',
          connectionOptions: {
            connectionString: 'nice',
          },
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
          favorite: {
            name: 'Dolphin',
          },
        },
        {
          id: 'turtle',
          connectionOptions: {
            connectionString: '',
          },
        },
        {
          id: 'oranges',
          connectionOptions: {
            connectionString: '',
          },
        },
      ];
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHook(() =>
        useConnections({
          onConnected: noop,
          connectionStorage: mockConnectionStorage,
          connectFn: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.state.connections.length).to.equal(3);
      });
      await result.current.removeAllRecentsConnections();

      expect(loadAllSpyWithData.callCount).to.equal(1);
      expect(deleteSpy.callCount).to.equal(2);
      await waitFor(() => {
        expect(result.current.state.connections.length).to.equal(1);
      });
    });
  });
  describe('#duplicateConnection', function () {
    let hookResult: RenderResult<ReturnType<typeof useConnections>>;

    it('should duplicate a connection', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHook(() =>
        useConnections({
          onConnected: noop,
          connectionStorage: mockConnectionStorage,
          connectFn: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.state.connections.length).to.equal(2);
      });
      result.current.setActiveConnectionById('turtle');
      result.current.duplicateConnection(result.current.state.connections[0]);

      expect(loadAllSpyWithData.callCount).to.equal(1);
      expect(saveSpy.callCount).to.equal(1);

      await waitFor(() => {
        expect(result.current.state.connections.length).to.equal(3);
      });

      hookResult = result;
    });

    it('should set the duplicated connection as current active', function () {
      const originalConnection = hookResult.current.state.connections[0];
      const duplicatedConnection = hookResult.current.state.connections[2];
      expect(duplicatedConnection.favorite.name).to.equal('turtles (copy)');
      expect(duplicatedConnection.id).not.undefined;
      expect(duplicatedConnection.connectionOptions.connectionString).to.equal(
        originalConnection.connectionOptions.connectionString
      );

      // check active connection
      expect(hookResult.current.state.activeConnectionId).equal(
        duplicatedConnection.id
      );
      expect(hookResult.current.state.activeConnectionInfo).deep.equal(
        duplicatedConnection
      );
    });
  });
  describe('#removeConnection', function () {
    let hookResult: RenderResult<ReturnType<typeof useConnections>>;
    it('should remove a connection', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHook(() =>
        useConnections({
          onConnected: noop,
          connectionStorage: mockConnectionStorage,
          connectFn: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.state.connections.length).to.equal(2);
      });
      act(() => {
        result.current.setActiveConnectionById('turtle');
      });
      result.current.removeConnection(result.current.state.connections[0]);

      expect(loadAllSpyWithData.callCount).to.equal(1);
      expect(deleteSpy.callCount).to.equal(1);
      await waitFor(() => {
        expect(result.current.state.connections.length).to.equal(1);
      });

      expect(result.current.state.connections[0].id).to.equal('oranges');
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
          favorite: {
            name: 'turtles',
          },
        },
        {
          id: 'oranges',
          connectionOptions: {
            connectionString: 'mongodb://peaches',
          },
          favorite: {
            name: 'peaches',
          },
        },
      ];
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHook(() =>
        useConnections({
          onConnected: noop,
          connectionStorage: mockConnectionStorage,
          connectFn: noop,
          appName: 'Test App Name',
        })
      );
      await waitFor(() => {
        expect(result.current.state.connections.length).to.equal(2);
      });
      act(() => {
        result.current.setActiveConnectionById('turtle');
      });
      expect(loadAllSpyWithData.callCount).to.equal(1);
      result.current.createNewConnection();
      expect(result.current.state.activeConnectionId).not.undefined;
      expect(
        result.current.state.activeConnectionInfo.connectionOptions
          .connectionString
      ).equal('mongodb://localhost:27017');
    });
  });
});
