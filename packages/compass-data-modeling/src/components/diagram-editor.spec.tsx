import React from 'react';
import { expect } from 'chai';
import {
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import DiagramEditor from './diagram-editor';
import { renderWithOpenedDiagramStore } from '../../test/setup-store';
import type { DataModelingStore } from '../../test/setup-store';
import { DataModelStorageServiceProvider } from '../provider';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import { DiagramProvider } from '@mongodb-js/diagramming';

const storageItems: MongoDBDataModelDescription[] = [
  {
    id: '1',
    name: 'One',
    createdAt: '2023-10-01T00:00:00.000Z',
    updatedAt: '2023-10-03T00:00:00.000Z',
    edits: [
      {
        id: 'edit-id-1',
        timestamp: '2023-10-02T00:00:00.000Z',
        type: 'SetModel',
        model: {
          collections: [
            {
              ns: 'db1.collection1',
              indexes: [],
              displayPosition: [1, 1],
              shardKey: {},
              jsonSchema: { bsonType: 'object' },
            },
          ],
          relationships: [],
        },
      },
    ],
    connectionId: null,
  },
];

const renderDiagramEditor = async ({
  items = storageItems,
}: {
  items?: MongoDBDataModelDescription[];
} = {}) => {
  const mockDataModelStorage = {
    status: 'READY',
    error: null,
    items,
    save: () => {
      return Promise.resolve(false);
    },
    delete: () => {
      return Promise.resolve(false);
    },
    loadAll: () => Promise.resolve(items),
    load: (id: string) => {
      return Promise.resolve(items.find((x) => x.id === id) ?? null);
    },
  };
  console.log(DiagramProvider);
  const result = await renderWithOpenedDiagramStore(
    <DataModelStorageServiceProvider storage={mockDataModelStorage}>
      <DiagramProvider fitView>
        <DiagramEditor />
      </DiagramProvider>
    </DataModelStorageServiceProvider>,
    {
      services: {
        dataModelStorage: mockDataModelStorage,
      },
    },
    items[0]
  );
  return result;
};

describe.only('DiagramEditor', function () {
  let store: DataModelingStore;

  beforeEach(async function () {
    const result = await renderDiagramEditor();
    store = result.store;

    // wait till the editor is loaded
    // await waitFor(() => {
    //   expect(screen.getByTestId('model-preview')).to.be.visible;
    // });
  });

  it('shows the list of diagrams', async function () {
    // screen.debug()
  });
});
