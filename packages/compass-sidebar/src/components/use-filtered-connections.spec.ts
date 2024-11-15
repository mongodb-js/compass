import type {
  SidebarConnectedConnection,
  SidebarConnection,
} from '@mongodb-js/compass-connections-navigation';
import { useFilteredConnections } from './use-filtered-connections';
import _ from 'lodash';
import Sinon from 'sinon';
import { expect } from 'chai';
import { renderHook, waitFor } from '@mongodb-js/testing-library-compass';

const connectedConnection1 = {
  id: 'connected_connection_1',
  connectionOptions: {
    connectionString: 'mongodb://connected_connection_1',
  },
};

const connectedConnection2 = {
  id: 'connected_connection_2',
  connectionOptions: {
    connectionString: 'mongodb://connected_connection_2',
  },
};

const disconnectedConnection = {
  id: 'disconnected_connection_1',
  connectionOptions: {
    connectionString: 'mongodb://disconnected_connection_1',
  },
};

const sidebarConnections: SidebarConnection[] = [
  {
    name: 'connected_connection_1',
    connectionInfo: connectedConnection1,
    connectionStatus: 'connected',
    isReady: true,
    isWritable: true,
    isPerformanceTabAvailable: true,
    isPerformanceTabSupported: true,
    isGenuineMongoDB: true,
    isDataLake: false,
    databases: [
      {
        _id: 'db_ready_1_1',
        name: 'db_ready_1_1',
        collections: [
          {
            _id: 'coll_ready_1_1',
            name: 'coll_ready_1_1',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
        ],
        collectionsLength: 1,
        collectionsStatus: 'ready',
      },
      {
        _id: 'db_ready_1_2',
        name: 'db_ready_1_2',
        collections: [
          {
            _id: 'coll_ready_1_2',
            name: 'coll_ready_1_2',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
        ],
        collectionsLength: 1,
        collectionsStatus: 'ready',
      },
    ],
    databasesStatus: 'ready',
    databasesLength: 2,
  },
  {
    name: 'connected_connection_2',
    connectionInfo: connectedConnection2,
    connectionStatus: 'connected',
    isReady: true,
    isWritable: true,
    isPerformanceTabAvailable: true,
    isPerformanceTabSupported: true,
    isGenuineMongoDB: true,
    isDataLake: false,
    databases: [
      {
        _id: 'db_ready_2_1',
        name: 'db_ready_2_1',
        collections: [
          {
            _id: 'coll_ready_2_1',
            name: 'coll_ready_2_1',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
          {
            _id: 'coll_ready_2_2',
            name: 'coll_ready_2_2',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
        ],
        collectionsLength: 1,
        collectionsStatus: 'ready',
      },
    ],
    databasesStatus: 'ready',
    databasesLength: 1,
  },
  {
    name: 'disconnected_connection_1',
    connectionStatus: 'disconnected',
    connectionInfo: disconnectedConnection,
  },
];

describe('useFilteredConnections', function () {
  const fetchAllCollectionsStub = Sinon.stub();
  const onDatabaseExpandStub = Sinon.stub();

  const renderHookWithContext: typeof renderHook = (callback, options) => {
    return renderHook(callback, options);
  };

  let mockSidebarConnections: SidebarConnection[];
  beforeEach(function () {
    mockSidebarConnections = _.cloneDeep(sidebarConnections);
  });

  context('when not filtering', function () {
    it('as filtered, it should return undefined for filtered connections', async function () {
      const { result } = renderHookWithContext(useFilteredConnections, {
        initialProps: {
          connections: mockSidebarConnections,
          filter: { regex: null, excludeInactive: false },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        },
      });

      await waitFor(() => {
        expect(result.current.filtered).to.be.undefined;
      });
    });

    it('as expanded, it should return an object containing an expanded object for each connected connection item and false for disconnected ones', async function () {
      const { result } = renderHookWithContext(useFilteredConnections, {
        initialProps: {
          connections: mockSidebarConnections,
          filter: { regex: null, excludeInactive: false },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        },
      });

      await waitFor(() => {
        expect(result.current.expanded).to.deep.equal({
          connected_connection_1: {},
          connected_connection_2: {},
          disconnected_connection_1: false,
        });
      });
    });

    context('excluding inactive connections', function () {
      it('should match only connected collections items', function () {
        const { result, rerender } = renderHookWithContext(
          useFilteredConnections,
          {
            initialProps: {
              connections: mockSidebarConnections,
              filter: { regex: null, excludeInactive: true },
              fetchAllCollections: fetchAllCollectionsStub,
              onDatabaseExpand: onDatabaseExpandStub,
            },
          }
        );

        expect(result.current.filtered).to.be.deep.equal([
          sidebarConnections[0],
          sidebarConnections[1],
        ]);

        rerender({
          connections: mockSidebarConnections,
          filter: { regex: null, excludeInactive: false },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        });

        expect(result.current.filtered).to.be.undefined;
      });
    });

    context('and a connection is toggled', function () {
      it('should return the appropriate connection expanded state for the toggled connection', async function () {
        const { result } = renderHookWithContext(useFilteredConnections, {
          initialProps: {
            connections: mockSidebarConnections,
            filter: { regex: null, excludeInactive: false },
            fetchAllCollections: fetchAllCollectionsStub,
            onDatabaseExpand: onDatabaseExpandStub,
          },
        });

        // collapse it
        result.current.onConnectionToggle('connected_connection_1', false);
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: false,
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        // expand it
        result.current.onConnectionToggle('connected_connection_1', true);
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {},
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });
      });

      it('should retain the database expanded state when a connection is collapsed', async function () {
        const { result } = renderHookWithContext(useFilteredConnections, {
          initialProps: {
            connections: mockSidebarConnections,
            filter: { regex: null, excludeInactive: false },
            fetchAllCollections: fetchAllCollectionsStub,
            onDatabaseExpand: onDatabaseExpandStub,
          },
        });

        // lets first have the database expanded
        result.current.onDatabaseToggle(
          'connected_connection_1',
          'db_ready_1_1',
          true
        );
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: true,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        // collapse the connection
        result.current.onConnectionToggle('connected_connection_1', false);
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: false,
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        // expand it again and see that the database expanded state is retained
        result.current.onConnectionToggle('connected_connection_1', true);
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: true,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });
      });
    });

    context('and a database is toggled', function () {
      context('but connection is collapsed', function () {
        it('should always return collapsed for the corresponding connection', async function () {
          const { result } = renderHookWithContext(useFilteredConnections, {
            initialProps: {
              connections: mockSidebarConnections,
              filter: { regex: null, excludeInactive: false },
              fetchAllCollections: fetchAllCollectionsStub,
              onDatabaseExpand: onDatabaseExpandStub,
            },
          });

          result.current.onConnectionToggle('connected_connection_1', false);
          await waitFor(() => {
            expect(result.current.expanded).to.deep.equal({
              connected_connection_1: false,
              connected_connection_2: {},
              disconnected_connection_1: false,
            });
          });

          // collapse it but connection is not expanded
          result.current.onDatabaseToggle(
            'connected_connection_1',
            'db_ready_1_1',
            false
          );
          await waitFor(() => {
            expect(result.current.expanded).to.deep.equal({
              connected_connection_1: false,
              connected_connection_2: {},
              disconnected_connection_1: false,
            });
          });
        });
      });

      context('and connection is expanded', function () {
        it('should return the appropriate database expanded state for the toggled database', async function () {
          const { result } = renderHookWithContext(useFilteredConnections, {
            initialProps: {
              connections: mockSidebarConnections,
              filter: { regex: null, excludeInactive: false },
              fetchAllCollections: fetchAllCollectionsStub,
              onDatabaseExpand: onDatabaseExpandStub,
            },
          });

          // expand it
          result.current.onDatabaseToggle(
            'connected_connection_1',
            'db_ready_1_1',
            true
          );
          await waitFor(() => {
            expect(result.current.expanded).to.deep.equal({
              connected_connection_1: {
                db_ready_1_1: true,
              },
              connected_connection_2: {},
              disconnected_connection_1: false,
            });
          });

          // collapse it
          result.current.onDatabaseToggle(
            'connected_connection_1',
            'db_ready_1_1',
            false
          );
          await waitFor(() => {
            expect(result.current.expanded).to.deep.equal({
              connected_connection_1: {
                db_ready_1_1: false,
              },
              connected_connection_2: {},
              disconnected_connection_1: false,
            });
          });
        });
      });
    });

    context('and all connections are collapsed', function () {
      it('as expanded, it should return an object containing an false for all the connections', async function () {
        const { result } = renderHookWithContext(useFilteredConnections, {
          initialProps: {
            connections: mockSidebarConnections,
            filter: { regex: null, excludeInactive: false },
            fetchAllCollections: fetchAllCollectionsStub,
            onDatabaseExpand: onDatabaseExpandStub,
          },
        });

        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {},
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        result.current.onCollapseAll();
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: false,
            connected_connection_2: false,
            disconnected_connection_1: false,
          });
        });
      });
    });

    // happens when a connection is disconnected / connected
    context('and active connections changed', function () {
      it('should clean up the expanded state for disconnected connections', async function () {
        const { result, rerender } = renderHookWithContext(
          useFilteredConnections,
          {
            initialProps: {
              connections: mockSidebarConnections,
              filter: { regex: null, excludeInactive: false },
              fetchAllCollections: fetchAllCollectionsStub,
              onDatabaseExpand: onDatabaseExpandStub,
            },
          }
        );

        // toggle a database
        result.current.onDatabaseToggle(
          'connected_connection_2',
          'db_ready_2_1',
          true
        );
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {},
            connected_connection_2: {
              db_ready_2_1: true,
            },
            disconnected_connection_1: false,
          });
        });

        // now pretend that connection 2 is disconnected
        const newConnections: SidebarConnection[] = [
          mockSidebarConnections[0],
          {
            ...mockSidebarConnections[1],
            connectionStatus: 'disconnected',
          },
          mockSidebarConnections[2],
        ];
        rerender({
          connections: newConnections,
          filter: { regex: null, excludeInactive: false },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        });
        // should remove the expanded state of connection 2
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {},
            connected_connection_2: false,
            disconnected_connection_1: false,
          });
        });

        // now pretend again that connection2 is connected
        rerender({
          connections: mockSidebarConnections,
          filter: { regex: null, excludeInactive: false },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        });
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {},
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });
      });
    });
  });

  context('when filtering', function () {
    it('should match the connection items', async function () {
      const { result, rerender } = renderHookWithContext(
        useFilteredConnections,
        {
          initialProps: {
            connections: mockSidebarConnections,
            filter: {
              regex: new RegExp('_connection', 'i'), // match everything basically
              excludeInactive: false,
            },
            fetchAllCollections: fetchAllCollectionsStub,
            onDatabaseExpand: onDatabaseExpandStub,
          },
        }
      );

      await waitFor(() => {
        expect(result.current.filtered).to.be.deep.equal(
          mockSidebarConnections
        );
      });

      rerender({
        connections: mockSidebarConnections,
        filter: {
          regex: new RegExp('disconnected_connection', 'i'), // match disconnected one
          excludeInactive: false,
        },
        fetchAllCollections: fetchAllCollectionsStub,
        onDatabaseExpand: onDatabaseExpandStub,
      });
      await waitFor(() => {
        expect(result.current.filtered).to.be.deep.equal([
          mockSidebarConnections[2], // this is the disconnected tree item
        ]);
      });
    });

    it('should match the database items', async function () {
      const { result } = renderHookWithContext(useFilteredConnections, {
        initialProps: {
          connections: mockSidebarConnections,
          filter: {
            regex: new RegExp('db_ready_1_1', 'i'), // match first database basically
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        },
      });

      const matchedItem = sidebarConnections[0] as SidebarConnectedConnection;

      await waitFor(() => {
        expect(result.current.filtered).to.be.deep.equal([
          {
            ...matchedItem,
            // will only match one database
            databases: [matchedItem.databases[0]],
          },
        ]);
      });
    });

    it('should not filter the database items if the parent is also a match', async function () {
      const { result } = renderHookWithContext(useFilteredConnections, {
        initialProps: {
          connections: [
            {
              ...mockSidebarConnections[0],
              name: 'Matching connection',
              databases: [
                {
                  ...(mockSidebarConnections[0] as SidebarConnectedConnection)
                    .databases[0],
                  name: 'Matching database',
                },
                {
                  ...(mockSidebarConnections[0] as SidebarConnectedConnection)
                    .databases[1],
                  name: 'Another database',
                },
              ],
            } as SidebarConnectedConnection,
          ],
          filter: {
            regex: new RegExp('Matching', 'i'), // this matches connection as well as database
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        },
      });

      await waitFor(() => {
        expect(
          (result.current.filtered?.[0] as SidebarConnectedConnection).databases
        ).to.have.length(2); // both databases are included
      });
    });

    it('should match the collection items', async function () {
      const { result } = renderHookWithContext(useFilteredConnections, {
        initialProps: {
          connections: mockSidebarConnections,
          filter: {
            regex: new RegExp('coll_ready_2_1', 'i'), // match second db's collection
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        },
      });

      const matchedItem = sidebarConnections[1] as SidebarConnectedConnection;

      await waitFor(() => {
        expect(result.current.filtered).to.be.deep.equal([
          {
            ...matchedItem,
            // will only match the second database's collection
            databases: [
              {
                ...matchedItem.databases[0],
                collections: [matchedItem.databases[0].collections[0]],
              },
            ],
          },
        ]);
      });
    });

    it('should not filter the collection items if the parent is also a match', async function () {
      const { result } = renderHookWithContext(useFilteredConnections, {
        initialProps: {
          connections: mockSidebarConnections,
          filter: {
            regex: new RegExp('ready_2_1', 'i'), // this matches 1 database and 1 collection
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        },
      });

      await waitFor(() => {
        expect(
          (result.current.filtered?.[0] as SidebarConnectedConnection)
            .databases[0].collections
        ).to.have.length(2); // the result has 2 collections
      });
    });

    it('as expanded, it should return an object containing an expanded object for the matching items', async function () {
      const { result } = renderHookWithContext(useFilteredConnections, {
        initialProps: {
          connections: mockSidebarConnections,
          filter: {
            regex: new RegExp('coll_ready_1_1', 'i'),
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        },
      });

      await waitFor(() => {
        expect(result.current.expanded).to.deep.equal({
          connected_connection_1: {
            db_ready_1_1: true,
          },
          connected_connection_2: {},
          disconnected_connection_1: false,
        });
      });
    });

    context('excluding inactive connections', function () {
      it('should match only connected collections items', function () {
        const { result, rerender } = renderHookWithContext(
          useFilteredConnections,
          {
            initialProps: {
              connections: mockSidebarConnections,
              filter: {
                regex: new RegExp('connection_1'),
                excludeInactive: true,
              },
              fetchAllCollections: fetchAllCollectionsStub,
              onDatabaseExpand: onDatabaseExpandStub,
            },
          }
        );

        expect(result.current.filtered).to.be.deep.equal([
          sidebarConnections[0],
        ]);

        rerender({
          connections: mockSidebarConnections,
          filter: {
            regex: new RegExp('connection_1'),
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        });

        expect(result.current.filtered).to.be.deep.equal([
          sidebarConnections[0],
          sidebarConnections[2],
        ]);
      });
    });

    context('and items are already collapsed', function () {
      it('should expand the items temporarily', async function () {
        const { result, rerender } = renderHookWithContext(
          useFilteredConnections,
          {
            initialProps: {
              connections: mockSidebarConnections,
              filter: {
                regex: null as RegExp | null,
                excludeInactive: false,
              },
              fetchAllCollections: fetchAllCollectionsStub,
              onDatabaseExpand: onDatabaseExpandStub,
            },
          }
        );

        result.current.onCollapseAll();
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: false,
            connected_connection_2: false,
            disconnected_connection_1: false,
          });
        });

        rerender({
          connections: mockSidebarConnections,
          filter: {
            regex: new RegExp('coll_ready_1_1', 'i'),
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        });
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: true,
            },
            connected_connection_2: false,
            disconnected_connection_1: false,
          });
        });
      });
    });

    context('and filter is removed', function () {
      it('should revert the temporarily expanded state', async function () {
        const { result, rerender } = renderHookWithContext(
          useFilteredConnections,
          {
            initialProps: {
              connections: mockSidebarConnections,
              filter: {
                regex: new RegExp('coll_ready_1_1', 'i') as RegExp | null,
                excludeInactive: false,
              },
              fetchAllCollections: fetchAllCollectionsStub,
              onDatabaseExpand: onDatabaseExpandStub,
            },
          }
        );
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: true,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        rerender({
          connections: mockSidebarConnections,
          filter: {
            regex: null,
            excludeInactive: false,
          },
          fetchAllCollections: fetchAllCollectionsStub,
          onDatabaseExpand: onDatabaseExpandStub,
        });
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: false,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });
      });
    });

    context('and onConnectionToggle is triggered', function () {
      it('should return a new expanded list', async function () {
        const { result } = renderHookWithContext(useFilteredConnections, {
          initialProps: {
            connections: mockSidebarConnections,
            filter: {
              regex: new RegExp('coll_ready_1_1', 'i'),
              excludeInactive: false,
            },
            fetchAllCollections: fetchAllCollectionsStub,
            onDatabaseExpand: onDatabaseExpandStub,
          },
        });

        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: true,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        result.current.onConnectionToggle('connected_connection_1', false);
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: false,
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });
      });
    });

    context('and onDatabaseToggle is triggered', function () {
      it('should return a new expanded list', async function () {
        const { result } = renderHookWithContext(useFilteredConnections, {
          initialProps: {
            connections: mockSidebarConnections,
            filter: {
              regex: new RegExp('coll_ready_1_1', 'i'),
              excludeInactive: false,
            },
            fetchAllCollections: fetchAllCollectionsStub,
            onDatabaseExpand: onDatabaseExpandStub,
          },
        });

        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: true,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        result.current.onDatabaseToggle(
          'connected_connection_1',
          'db_ready_1_1',
          false
        );
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: false,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });
      });
    });

    context('and onCollapseAll is triggered', function () {
      it('should return a new expanded list', async function () {
        const { result } = renderHookWithContext(useFilteredConnections, {
          initialProps: {
            connections: mockSidebarConnections,
            filter: {
              regex: new RegExp('coll_ready_1_1', 'i'),
              excludeInactive: false,
            },
            fetchAllCollections: fetchAllCollectionsStub,
            onDatabaseExpand: onDatabaseExpandStub,
          },
        });

        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: {
              db_ready_1_1: true,
            },
            connected_connection_2: {},
            disconnected_connection_1: false,
          });
        });

        result.current.onCollapseAll();
        await waitFor(() => {
          expect(result.current.expanded).to.deep.equal({
            connected_connection_1: false,
            connected_connection_2: false,
            disconnected_connection_1: false,
          });
        });
      });
    });
  });
});
