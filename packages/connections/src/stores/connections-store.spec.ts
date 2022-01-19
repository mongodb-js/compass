import { expect } from 'chai';
import { waitFor } from '@testing-library/react';
import { renderHook, act, RenderResult } from '@testing-library/react-hooks';
import sinon from 'sinon';

import { ConnectionStore, useConnections } from './connections-store';

const noop = (): any => {
  /* no-op */
};

const mockConnections = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: '',
    },
    favorite: {
      name: 'turtles',
    },
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: '',
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

  beforeEach(function () {
    loadAllSpy = sinon.spy();
    saveSpy = sinon.spy();

    mockConnectionStorage = {
      loadAll: loadAllSpy,
      save: saveSpy,
    };
  });

  describe('#loadConnections', function () {
    it('loads the connections from the connection storage', async function () {
      const loadAllSpyWithData = sinon.fake.resolves(mockConnections);
      mockConnectionStorage.loadAll = loadAllSpyWithData;

      const { result } = renderHook(() =>
        useConnections(noop, mockConnectionStorage, noop)
      );

      // Wait for the async loading of connections to complete.
      await waitFor(() =>
        expect(result.current[0].connections.length).to.equal(2)
      );

      expect(loadAllSpyWithData.callCount).to.equal(1);
      expect(result.current[0].connections.length).to.equal(2);
    });
  });

  describe('#saveConnection', function () {
    describe('with an existing connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        mockConnectionStorage.loadAll = () => Promise.resolve(mockConnections);

        const { result } = renderHook(() =>
          useConnections(noop, mockConnectionStorage, noop)
        );

        // Wait for the async loading of connections to complete.
        await waitFor(() =>
          expect(result.current[0].connections.length).to.equal(2)
        );

        await act(async () => {
          await result.current[1].saveConnection({
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
        expect(hookResult.current[0].connections.length).to.equal(2);
        expect(hookResult.current[0].connections[1]).to.deep.equal({
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
        expect(hookResult.current[0].connections[1]).to.not.equal(
          mockConnections[1]
        );
        expect(
          hookResult.current[0].connections[1].connectionOptions
        ).to.not.equal(mockConnections[1].connectionOptions);
      });
    });

    describe('saving a new connection', function () {
      let hookResult: RenderResult<ReturnType<typeof useConnections>>;
      beforeEach(async function () {
        const { result } = renderHook(() =>
          useConnections(noop, mockConnectionStorage, noop)
        );

        await act(async () => {
          await result.current[1].saveConnection({
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
        expect(hookResult.current[0].connections.length).to.equal(1);
        expect(hookResult.current[0].connections[0]).to.deep.equal({
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
          useConnections(noop, mockConnectionStorage, noop)
        );

        // Wait for the async loading of connections to complete.
        await waitFor(() =>
          expect(result.current[0].connections.length).to.equal(2)
        );

        // Make the first connection the active connection.
        act(() => {
          result.current[1].setActiveConnectionById('turtle');
        });

        await act(async () => {
          await result.current[1].saveConnection({
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
        expect(hookResult.current[0].activeConnectionId).to.equal('turtle');
        expect(hookResult.current[0].activeConnectionInfo).to.deep.equal({
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
        expect(hookResult.current[0].connections.length).to.equal(2);
        expect(hookResult.current[0].connections[0]).to.deep.equal({
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
});
