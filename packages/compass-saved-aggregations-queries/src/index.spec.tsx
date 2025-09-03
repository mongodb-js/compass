import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import { queries, pipelines } from '../test/fixtures';
import { WorkspaceTab } from '.';
import type {
  PipelineStorage,
  FavoriteQueryStorage,
} from '@mongodb-js/my-queries-storage/provider';
import {
  type MongoDBInstance,
  type MongoDBInstancesManager,
  TestMongoDBInstanceManager,
} from '@mongodb-js/compass-app-stores/provider';
import { type WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import type { RenderWithConnectionsResult } from '@mongodb-js/testing-library-compass';
import {
  renderWithConnections,
  screen,
  cleanup,
  within,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';

let id = 0;
function getConnection() {
  id += 1;
  return {
    connectionInfo: {
      id: `${id}FOO`,
      connectionOptions: {
        connectionString: `mongodb://localhost:2702${id}`,
      },
    },
    instance: {
      fetchDatabases() {},
      getNamespace() {},
    } as unknown as MongoDBInstance,
  };
}

describe('AggregationsAndQueriesAndUpdatemanyList', function () {
  const sandbox = Sinon.createSandbox();
  const query = {
    _id: '123',
    _name: 'Query',
    _ns: 'bar.foo',
    _dateSaved: new Date(),
    filter: { foo: 'bar' },
    sort: { bar: -1 },
  } as any;
  const updatemany = {
    _id: '5667',
    _name: 'Updatemany',
    _ns: 'bar.baz',
    _dateSaved: new Date(),
    filter: { foo: 'baz' },
    sort: { baz: -1 },
  } as any;
  const aggregation = {
    id: '123',
    name: 'Aggregation',
    namespace: 'foo.bar',
    lastModified: 0,
    pipelineText: `[
  {
    $match: {
      "field": 42
    }
  }
]`,
  } as any;
  let connectionOne: ReturnType<typeof getConnection>;
  let connectionTwo: ReturnType<typeof getConnection>;
  let queryStorage: FavoriteQueryStorage;
  let pipelineStorage: PipelineStorage;
  let instancesManager: MongoDBInstancesManager;
  let workspaces: Sinon.SinonSpiedInstance<WorkspacesService>;
  let connectionsStore: RenderWithConnectionsResult['connectionsStore'];

  const renderPlugin = () => {
    const PluginWithMocks = WorkspaceTab.provider.withMockServices({
      instancesManager,
      favoriteQueryStorageAccess: {
        getStorage() {
          return queryStorage;
        },
      },
      pipelineStorage: pipelineStorage,
      workspaces,
    });
    const result = renderWithConnections(
      <PluginWithMocks>
        <WorkspaceTab.content />
      </PluginWithMocks>,
      {
        connections: [
          connectionOne.connectionInfo,
          connectionTwo.connectionInfo,
        ],
      }
    );
    connectionsStore = result.connectionsStore;
  };

  const selectContextMenuItem = (
    itemId: string,
    item: 'open-in' | 'rename' | 'copy' | 'delete'
  ) => {
    const queryCard = document.querySelector<HTMLElement>(
      `[data-id="${itemId}"]`
    );
    if (!queryCard) {
      throw new Error('Query card not yet rendered');
    }

    userEvent.hover(queryCard);
    userEvent.click(screen.getByTestId('saved-item-actions-show-actions'));
    userEvent.click(screen.getByTestId(`saved-item-actions-${item}-action`));
    return queryCard;
  };

  beforeEach(function () {
    connectionOne = getConnection();
    connectionTwo = getConnection();
    queryStorage = {
      loadAll() {
        return Promise.resolve([]);
      },
      updateAttributes() {},
    } as unknown as FavoriteQueryStorage;
    pipelineStorage = {
      loadAll() {
        return Promise.resolve([]);
      },
      updateAttributes() {},
    } as unknown as PipelineStorage;
    instancesManager = new TestMongoDBInstanceManager();
    workspaces = sandbox.spy({
      openCollectionWorkspace() {},
    } as unknown as WorkspacesService);

    sandbox
      .stub(instancesManager, 'getMongoDBInstanceForConnection')
      .callsFake((id) => {
        if (id === connectionOne.connectionInfo.id) {
          return connectionOne.instance;
        } else if (id === connectionTwo.connectionInfo.id) {
          return connectionTwo.instance;
        } else {
          throw new Error('Unexpected id');
        }
      });
  });

  afterEach(function () {
    sandbox.restore();
    cleanup();
    id = 0;
    connectionOne = getConnection();
    connectionTwo = getConnection();
  });

  it('should display no saved items when user has no saved queries/aggregations', async function () {
    renderPlugin();
    expect(await screen.findByText('No saved queries yet.')).to.exist;
  });

  it('should load queries and display them in the list', async function () {
    sandbox.stub(queryStorage, 'loadAll').resolves([query, updatemany]);
    renderPlugin();
    expect(await screen.findByText('Query')).to.exist;
    await waitFor(() => expect(screen.findByText(query._name)).to.exist);
  });

  it('should load aggregations and display them in the list', async function () {
    sandbox.stub(pipelineStorage, 'loadAll').resolves([aggregation]);
    renderPlugin();
    expect(await screen.findByText('Aggregation')).to.exist;
    await waitFor(() => expect(screen.findByText(aggregation.name)).to.exist);
  });

  describe('copy to clipboard', function () {
    it('should copy query to the clipboard', async function () {
      sandbox.stub(queryStorage, 'loadAll').resolves([query, updatemany]);
      renderPlugin();
      expect(await screen.findByText(query._name)).to.exist;

      selectContextMenuItem(query._id, 'copy');

      expect(await navigator.clipboard.readText()).to.eq(`{
  "collation": null,
  "filter": {
    "foo": "bar"
  },
  "limit": null,
  "project": null,
  "skip": null,
  "sort": {
    "bar": -1
  }
}`);
    });

    it('should copy aggregation to the clipboard', async function () {
      sandbox.stub(pipelineStorage, 'loadAll').resolves([aggregation]);
      renderPlugin();
      expect(await screen.findByText(aggregation.name)).to.exist;

      selectContextMenuItem(aggregation.id, 'copy');

      expect(await navigator.clipboard.readText()).to.eq(`[
  {
    $match: {
      "field": 42
    }
  }
]`);
    });
  });

  context('with fixtures', function () {
    let queryStorageLoadAllStub: Sinon.SinonStub;
    beforeEach(async function () {
      queryStorageLoadAllStub = sandbox
        .stub(queryStorage, 'loadAll')
        .resolves(queries.map((item) => item.query));
      sandbox.stub(pipelineStorage, 'loadAll').resolves(
        pipelines.map((item) => {
          return { ...item.aggregation, lastModified: new Date() };
        })
      );

      renderPlugin();

      // Wait for the items to "load"
      await screen.findByText(queries[0].name);
    });

    it('should filter items by database/collection', function () {
      const { database, collection } = queries[0];

      // select database
      userEvent.click(screen.getByRole('button', { name: 'All databases' }));
      userEvent.click(screen.getByRole('option', { name: database }));

      // select collection
      userEvent.click(screen.getByRole('button', { name: 'All collections' }));
      userEvent.click(screen.getByRole('option', { name: collection }));

      const expectedItems = [...queries, ...pipelines].filter(
        (item) => item.database === database && item.collection === collection
      );

      expectedItems.forEach((item) => {
        expect(screen.getByText(item.name)).to.exist;
      });
    });

    it('should rename an item', async function () {
      const item = queries[0];

      const updatedName = 'the updated name';

      // Post the update we fetch all queries to load the updated query
      sandbox
        .stub(queryStorage, 'updateAttributes')
        .callsFake((id, attributes) => {
          expect(id).to.equal(item.id);
          expect(attributes._name).to.equal(updatedName);
          let updatedQuery: any;
          queryStorageLoadAllStub.resolves(
            queries.map(({ query }) => {
              if (query._id === item.query._id) {
                return (updatedQuery = {
                  ...item.query,
                  _name: updatedName,
                });
              }
              return query;
            })
          );
          return Promise.resolve(updatedQuery);
        });

      selectContextMenuItem(item.id, 'rename');

      const modal = screen.getByTestId('edit-item-modal');

      const title = new RegExp('rename query', 'i');
      expect(within(modal).getByText(title), 'show title').to.exist;

      const nameInput = within(modal).getByRole('textbox', {
        name: /name/i,
      });

      expect(nameInput, 'show name input').to.exist;
      expect(nameInput, 'input with item name').to.have.property(
        'value',
        item.name
      );

      expect(
        within(modal)
          .getByRole<HTMLButtonElement>('button', {
            name: /update/i,
          })
          .getAttribute('aria-disabled'),
        'submit button is disabled when user has not changed field value'
      ).to.equal('true');

      userEvent.clear(nameInput);
      expect(
        within(modal)
          .getByRole<HTMLButtonElement>('button', {
            name: /update/i,
          })
          .getAttribute('aria-disabled'),
        'submit button is disabled when field value is empty'
      ).to.equal('true');

      userEvent.type(nameInput, updatedName);
      userEvent.click(
        within(modal).getByRole<HTMLButtonElement>('button', {
          name: /update/i,
        })
      );

      await waitFor(() => {
        expect(screen.queryByText(item.name)).to.not.exist;
        expect(screen.getByText(updatedName)).to.exist;
      });
    });

    it('should not update an item if rename was not confirmed', async function () {
      const item = queries[0];
      selectContextMenuItem(item.id, 'rename');

      const modal = await screen.findByTestId('edit-item-modal');

      userEvent.click(within(modal).getByText('Cancel'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(screen.queryByText(item.name)).to.exist;
    });
  });

  context('with possible multiple connections', function () {
    const renderPluginWithWait = async () => {
      renderPlugin();
      await screen.findByText(query._name);
    };

    const selectCardForItem = (itemId: string) => {
      const queryCard = document.querySelector<HTMLElement>(
        `[data-id="${itemId}"]`
      );
      if (!queryCard) {
        throw new Error('Query card not yet rendered');
      }
      userEvent.click(queryCard);
      return queryCard;
    };

    const selectDropdownOption = async (
      selectDataTestId: string,
      value: string
    ) => {
      const selectBtn = screen.getByTestId(selectDataTestId);
      userEvent.click(selectBtn);
      await waitFor(() => {
        expect(screen.getByLabelText(new RegExp(value, 'i'))).to.exist;
      });

      userEvent.click(screen.getByLabelText(new RegExp(value, 'i')));

      await waitFor(() => {
        expect(screen.getByLabelText(new RegExp(value, 'i'))).to.throw;
      });
    };

    const mockedInstanceWithDatabaseAndCollection = (prefix: string) => {
      const dummyDbModel = {
        fetchCollections() {},
        collections: [{ name: `${prefix}-dummy-coll` }],
      };

      const databases = [{ name: `${prefix}-dummy-db` }];
      Object.defineProperty(databases, 'get', {
        value: () => {
          return dummyDbModel;
        },
        enumerable: false,
      });

      return {
        fetchDatabases() {},
        getNamespace() {},
        databases,
      } as unknown as MongoDBInstance;
    };

    beforeEach(function () {
      sandbox.stub(queryStorage, 'loadAll').resolves([query, updatemany]);
    });

    context('when not connected to any connection', function () {
      context('and clicked on a saved item', function () {
        it('should show not connected modal', async function () {
          await renderPluginWithWait();
          selectCardForItem(query._id);
          await waitFor(() => {
            expect(screen.getByTestId('no-active-connection-modal')).to.exist;
          });
        });
      });

      context(
        'and trying to open the query using context menu "Open in"',
        function () {
          it('should show not connected modal', async function () {
            await renderPluginWithWait();
            selectContextMenuItem(query._id, 'open-in');
            await waitFor(() => {
              expect(screen.getByTestId('no-active-connection-modal')).to.exist;
            });
          });
        }
      );
    });

    context('when connected to just one connection', function () {
      context('and clicked on a saved item', function () {
        it('should open the query right away if the namespace exist in the current connection', async function () {
          sandbox
            .stub(connectionOne.instance, 'getNamespace')
            .resolves({} as any);

          await renderPluginWithWait();
          await connectionsStore.actions.connect(connectionOne.connectionInfo);

          selectCardForItem(query._id);
          await waitFor(() => {
            expect(
              workspaces.openCollectionWorkspace
            ).to.be.calledOnceWithExactly(
              `${connectionOne.connectionInfo.id}`,
              `${query._ns}`,
              {
                initialAggregation: undefined,
                initialQuery: query,
                newTab: true,
              }
            );
          });
        });

        context(
          'and namespace does not exist in the current connection',
          function () {
            it('should open the namespace not found modal and allow opening query from right within the modal', async function () {
              const queryStorageUpdateSpy = sandbox.spy(
                queryStorage,
                'updateAttributes'
              );
              connectionOne.instance =
                mockedInstanceWithDatabaseAndCollection('connection-one');
              await renderPluginWithWait();
              await connectionsStore.actions.connect(
                connectionOne.connectionInfo
              );
              selectCardForItem(query._id);
              await waitFor(() => {
                expect(screen.getByTestId('open-item-modal')).to.exist;
              });

              expect(screen.getByText('Select a Namespace')).to.exist;
              expect(screen.getByTestId('description')).to.exist;
              // connection is already selected because there is only one
              expect(() => screen.getByTestId('connection-select-field')).to
                .throw;
              expect(screen.getByTestId('database-select-field')).to.exist;
              expect(screen.getByTestId('collection-select-field')).to.exist;

              // Selecting items to run the query
              await selectDropdownOption(
                'database-select',
                'connection-one-dummy-db'
              );
              await selectDropdownOption(
                'collection-select',
                'connection-one-dummy-coll'
              );
              screen.getByTestId('update-query-aggregation-checkbox').click();

              userEvent.click(screen.getByTestId('submit-button'));
              await waitFor(() => {
                expect(
                  workspaces.openCollectionWorkspace
                ).to.be.calledOnceWithExactly(
                  `${connectionOne.connectionInfo.id}`,
                  'connection-one-dummy-db.connection-one-dummy-coll',
                  {
                    initialAggregation: undefined,
                    initialQuery: query,
                    newTab: true,
                  }
                );
              });
              expect(queryStorageUpdateSpy).to.be.calledOnceWithExactly(
                query._id,
                { _ns: 'connection-one-dummy-db.connection-one-dummy-coll' }
              );
            });
          }
        );
      });

      context(
        'and trying to open the query using context menu "Open in"',
        function () {
          it('should open the select namespace modal and allow running query right from the modal', async function () {
            const queryStorageUpdateSpy = sandbox.spy(
              queryStorage,
              'updateAttributes'
            );
            connectionOne.instance =
              mockedInstanceWithDatabaseAndCollection('connection-one');
            await renderPluginWithWait();
            await connectionsStore.actions.connect(
              connectionOne.connectionInfo
            );
            selectContextMenuItem(query._id, 'open-in');

            await waitFor(() => {
              expect(screen.getByTestId('open-item-modal')).to.exist;
            });

            // Modal content expectations
            expect(screen.getByText('Select a Namespace')).to.exist;
            // We don't show description in this modal
            expect(() => screen.getByTestId('description')).to.throw;
            // connection is already selected because there is only one
            expect(() => screen.getByTestId('connection-select-field')).to
              .throw;
            expect(screen.getByTestId('database-select-field')).to.exist;
            expect(screen.getByTestId('collection-select-field')).to.exist;

            // Now selecting items to run the query
            await selectDropdownOption(
              'database-select',
              'connection-one-dummy-db'
            );
            await selectDropdownOption(
              'collection-select',
              'connection-one-dummy-coll'
            );
            screen.getByTestId('update-query-aggregation-checkbox').click();

            userEvent.click(screen.getByTestId('submit-button'));
            await waitFor(() => {
              expect(
                workspaces.openCollectionWorkspace
              ).to.be.calledOnceWithExactly(
                `${connectionOne.connectionInfo.id}`,
                'connection-one-dummy-db.connection-one-dummy-coll',
                {
                  initialAggregation: undefined,
                  initialQuery: query,
                  newTab: true,
                }
              );
            });
            expect(queryStorageUpdateSpy).to.be.calledOnceWithExactly(
              query._id,
              { _ns: 'connection-one-dummy-db.connection-one-dummy-coll' }
            );
          });
        }
      );
    });

    context('when connected to multiple connections', function () {
      context('and clicked on a saved item', function () {
        it('should open the query right away if the namespace exists in only one of the active connections', async function () {
          sandbox
            .stub(connectionTwo.instance, 'getNamespace')
            .resolves({} as any);
          await renderPluginWithWait();
          await connectionsStore.actions.connect(connectionOne.connectionInfo);
          await connectionsStore.actions.connect(connectionTwo.connectionInfo);
          selectCardForItem(query._id);

          await waitFor(() => {
            expect(
              workspaces.openCollectionWorkspace
            ).to.be.calledOnceWithExactly(
              `${connectionTwo.connectionInfo.id}`,
              query._ns,
              {
                initialAggregation: undefined,
                initialQuery: query,
                newTab: true,
              }
            );
          });
        });

        context(
          'and namespace exists in multiple active connections',
          function () {
            it('should open connection select modal and allow running query right from the modal', async function () {
              sandbox
                .stub(connectionOne.instance, 'getNamespace')
                .resolves({} as any);
              sandbox
                .stub(connectionTwo.instance, 'getNamespace')
                .resolves({} as any);
              await renderPluginWithWait();
              await connectionsStore.actions.connect(
                connectionOne.connectionInfo
              );
              await connectionsStore.actions.connect(
                connectionTwo.connectionInfo
              );
              selectCardForItem(query._id);

              await waitFor(() => {
                expect(screen.getByTestId('select-connection-modal')).to.exist;
              });

              // Modal content expectations
              expect(screen.getByText('Select a Connection')).to.exist;
              expect(
                screen.getByTestId(
                  `connection-item-${connectionOne.connectionInfo.id}`
                )
              ).to.exist;
              expect(
                screen.getByTestId(
                  `connection-item-${connectionTwo.connectionInfo.id}`
                )
              ).to.exist;

              // Now selecting a connection to open the query in
              userEvent.click(
                screen.getByTestId(
                  `connection-item-${connectionTwo.connectionInfo.id}`
                )
              );

              userEvent.click(screen.getByTestId('submit-button'));
              await waitFor(() => {
                expect(
                  workspaces.openCollectionWorkspace
                ).to.be.calledOnceWithExactly(
                  `${connectionTwo.connectionInfo.id}`,
                  query._ns,
                  {
                    initialAggregation: undefined,
                    initialQuery: query,
                    newTab: true,
                  }
                );
              });
            });
          }
        );

        context(
          'and namespace does not exist in any of the active connections',
          function () {
            it('should open select connection and namespace modal and allow running query right from the modal', async function () {
              const queryStorageUpdateSpy = sandbox.spy(
                queryStorage,
                'updateAttributes'
              );
              connectionTwo.instance =
                mockedInstanceWithDatabaseAndCollection('connection-two');
              await renderPluginWithWait();
              await connectionsStore.actions.connect(
                connectionOne.connectionInfo
              );
              await connectionsStore.actions.connect(
                connectionTwo.connectionInfo
              );
              selectCardForItem(query._id);

              await waitFor(() => {
                expect(screen.getByTestId('open-item-modal')).to.exist;
              });

              // Modal content expectations
              expect(screen.getByText('Select a Connection and Namespace')).to
                .exist;
              // We don't show description in this modal
              expect(() => screen.getByTestId('description')).to.throw;
              expect(screen.getByTestId('connection-select-field')).to.exist;
              expect(screen.getByTestId('database-select-field')).to.exist;
              expect(screen.getByTestId('collection-select-field')).to.exist;

              // Now selecting the items to run the query
              await selectDropdownOption(
                'connection-select',
                getConnectionTitle(connectionTwo.connectionInfo)
              );
              await selectDropdownOption(
                'database-select',
                'connection-two-dummy-db'
              );
              await selectDropdownOption(
                'collection-select',
                'connection-two-dummy-coll'
              );
              screen.getByTestId('update-query-aggregation-checkbox').click();

              userEvent.click(screen.getByTestId('submit-button'));
              await waitFor(() => {
                expect(
                  workspaces.openCollectionWorkspace
                ).to.be.calledOnceWithExactly(
                  `${connectionTwo.connectionInfo.id}`,
                  'connection-two-dummy-db.connection-two-dummy-coll',
                  {
                    initialAggregation: undefined,
                    initialQuery: query,
                    newTab: true,
                  }
                );
              });
              expect(queryStorageUpdateSpy).to.be.calledOnceWithExactly(
                query._id,
                { _ns: 'connection-two-dummy-db.connection-two-dummy-coll' }
              );
            });
          }
        );
      });
    });
  });
});
