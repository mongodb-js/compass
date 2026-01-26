import React from 'react';
import { expect } from 'chai';
import {
  createPluginTestHelpers,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import ReselectCollectionsModal from './reselect-collections-modal';
import dataModel from '../../test/fixtures/data-model-with-relationships.json';
import { DataModelingWorkspaceTab } from '..';
import { getCurrentModel, openDiagram } from '../store/diagram';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import { reselectCollections } from '../store/reselect-collections-wizard';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import toNS from 'mongodb-ns';
import { TestMongoDBInstanceManager } from '@mongodb-js/compass-app-stores/provider';

const DATA_MODEL_CONNECTION_ID = dataModel.connectionId;
const DATA_MODEL_SELECTED_COLLECTIONS = getCurrentModel(
  dataModel.edits as any
).collections.map((c) => toNS(c.ns).collection);

const MOCK_CONNECTIONS = [
  {
    id: '1',
    connectionOptions: { connectionString: 'mongodb://localhost:27017' },
  },
  {
    id: DATA_MODEL_CONNECTION_ID,
    connectionOptions: { connectionString: 'mongodb://localhost:27018' },
  },
];
const MOCK_COLLECTIONS = ['airlines', 'airports', 'users', 'coupons'];
const MOCK_DATABASES = [
  {
    _id: 'flights',
    name: 'flights',
    collections: MOCK_COLLECTIONS.map((name) => ({
      _id: `flights.${name}`,
      name: `flights.${name}`,
    })),
  },
  { _id: 'test', name: 'test', collections: [] },
];
const MOCK_DATA_SERVICE = {
  listDatabases: () => Promise.resolve(MOCK_DATABASES),
  databaseStats: () => Promise.resolve({}),
  listCollections: (db: string) =>
    Promise.resolve(MOCK_DATABASES.find((x) => x._id === db)?.collections),
};

function renderReselectCollectionsModal(props: {
  connections?: ConnectionInfo[];
  connectFn?: (info: ConnectionInfo) => any;
}) {
  const { renderWithConnections } = createPluginTestHelpers(
    DataModelingWorkspaceTab.provider.withMockServices({
      instanceManager: new TestMongoDBInstanceManager({
        databases: MOCK_DATABASES as any,
      }),
    })
  );
  const {
    plugin: { store },
    connectionsStore,
  } = renderWithConnections(<ReselectCollectionsModal />, {
    connections: props.connections || MOCK_CONNECTIONS,
    connectFn:
      props.connectFn || ((() => Promise.resolve(MOCK_DATA_SERVICE)) as any),
  });
  store.dispatch(openDiagram(dataModel as MongoDBDataModelDescription));
  return {
    store,
    connectionsStore,
  };
}

describe('ReselectCollectionsModal', function () {
  context('SELECT_CONNECTION step', function () {
    it('sets data in state when reselect collections is clicked', async function () {
      const { store } = renderReselectCollectionsModal({});
      await store.dispatch(reselectCollections());
      const state = store.getState().reselectCollections;
      expect(state.isOpen).to.be.true;
      expect(state.selectedConnectionId).to.equal(dataModel.connectionId);
      expect(state.selectedDatabase).to.equal(dataModel.database);
      expect(state.selectedCollections).to.have.members(
        DATA_MODEL_SELECTED_COLLECTIONS
      );
    });
    it('shows modal when reselecting collections', async function () {
      const { store } = renderReselectCollectionsModal({});
      await store.dispatch(reselectCollections());
      expect(screen.getByTestId('reselect-collections-modal')).to.exist;
    });
    it('shows list of connections and updates state when selected', async function () {
      const { store } = renderReselectCollectionsModal({});
      await store.dispatch(reselectCollections());
      userEvent.click(
        screen.getByRole('textbox', {
          name: /connection/i,
        })
      );
      userEvent.click(screen.getByLabelText('localhost:27018'));
      expect(
        store.getState().reselectCollections.selectedConnectionId
      ).to.equal(DATA_MODEL_CONNECTION_ID);
    });
    it('shows error when it fails to connect', async function () {
      const { store } = renderReselectCollectionsModal({
        connectFn: () => {
          return Promise.reject(new Error('Failure'));
        },
      });
      await store.dispatch(reselectCollections());
      userEvent.click(
        screen.getByRole('textbox', {
          name: /connection/i,
        })
      );
      userEvent.click(screen.getByLabelText('localhost:27018'));
      userEvent.click(screen.getByRole('button', { name: /connect/i }));

      await waitFor(() => {
        expect(screen.getByText(/failure/i)).to.exist;
      });
    });
    it('shows error when the selected database does not exist', async function () {
      const { store } = renderReselectCollectionsModal({
        connectFn: () => {
          return {
            listDatabases: () => Promise.resolve([]),
          };
        },
      });
      await store.dispatch(reselectCollections());
      userEvent.click(
        screen.getByRole('textbox', {
          name: /connection/i,
        })
      );
      userEvent.click(screen.getByLabelText('localhost:27018'));
      userEvent.click(screen.getByRole('button', { name: /connect/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            /the selected database does not exist on this connection/i
          )
        ).to.exist;
      });
    });
    it('shows SELECT_COLLECTIONS step when connection succeeds', async function () {
      const { store } = renderReselectCollectionsModal({});
      await store.dispatch(reselectCollections());
      userEvent.click(
        screen.getByRole('textbox', {
          name: /connection/i,
        })
      );
      userEvent.click(screen.getByLabelText('localhost:27018'));
      userEvent.click(screen.getByRole('button', { name: /connect/i }));

      await waitFor(() => {
        expect(store.getState().reselectCollections.isConnecting).to.equal(
          false
        );
      });

      expect(
        store.getState().reselectCollections.databaseCollections
      ).to.have.members(MOCK_COLLECTIONS);

      // We only show the collections from the database.
      for (const collection of MOCK_COLLECTIONS) {
        expect(screen.getByLabelText(collection)).to.exist;
      }
    });
  });
  context('SELECT_COLLECTIONS step', function () {
    it('shows SELECT_COLLECTIONS when its already connected', async function () {
      const { store, connectionsStore } = renderReselectCollectionsModal({});
      await connectionsStore.actions.connect(MOCK_CONNECTIONS[1]);
      await store.dispatch(reselectCollections());
      await waitFor(() => {
        return (
          store.getState().reselectCollections.step === 'SELECT_COLLECTIONS'
        );
      });

      expect(
        store.getState().reselectCollections.databaseCollections
      ).to.have.members(MOCK_COLLECTIONS);

      // We only show the collections from the database.
      for (const collection of MOCK_COLLECTIONS) {
        expect(screen.getByLabelText(collection)).to.exist;
      }
    });
    it('shows already selected collections as disabled', async function () {
      const { store, connectionsStore } = renderReselectCollectionsModal({});
      await connectionsStore.actions.connect(MOCK_CONNECTIONS[1]);
      await store.dispatch(reselectCollections());

      const disabledCollections = MOCK_COLLECTIONS.filter((c) =>
        DATA_MODEL_SELECTED_COLLECTIONS.includes(c)
      );
      for (const collection of disabledCollections) {
        const checkboxInput = screen.getByRole('checkbox', {
          name: collection,
        });
        expect(checkboxInput.ariaDisabled).to.equal('true');
      }
    });
    it('shows already new collections as selectable', async function () {
      const { store, connectionsStore } = renderReselectCollectionsModal({});
      await connectionsStore.actions.connect(MOCK_CONNECTIONS[1]);
      await store.dispatch(reselectCollections());

      const selectableCollections = MOCK_COLLECTIONS.filter(
        (c) => !DATA_MODEL_SELECTED_COLLECTIONS.includes(c)
      );
      for (const collection of selectableCollections) {
        const checkboxInput = screen.getByRole('checkbox', {
          name: collection,
        });
        expect(checkboxInput.ariaDisabled).to.equal('false');
      }
    });
    it('selects a new collection', async function () {
      const { store, connectionsStore } = renderReselectCollectionsModal({});
      await connectionsStore.actions.connect(MOCK_CONNECTIONS[1]);
      await store.dispatch(reselectCollections());

      // Click on a disabled one
      userEvent.click(
        screen.getByRole('checkbox', { name: 'airlines' }),
        undefined,
        {
          skipPointerEventsCheck: true,
        }
      );
      expect(
        store.getState().reselectCollections.newSelectedCollections
      ).to.deep.equal([]);

      // Click on an enabled one (users)
      userEvent.click(
        screen.getByRole('checkbox', { name: 'users' }),
        undefined,
        {
          skipPointerEventsCheck: true,
        }
      );
      expect(
        store.getState().reselectCollections.newSelectedCollections
      ).to.have.members(['users']);

      // Click on another enabled one (coupons)
      userEvent.click(
        screen.getByRole('checkbox', { name: 'coupons' }),
        undefined,
        {
          skipPointerEventsCheck: true,
        }
      );
      expect(
        store.getState().reselectCollections.newSelectedCollections
      ).to.have.members(['coupons', 'users']);
    });
  });
});
