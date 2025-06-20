const mockDiagramming = {
  // Keep original exports by spreading them (if needed)
  ...require('@mongodb-js/diagramming'),

  // Override Diagram import because it's causing esm/cjs interop issues
  Diagram: (props) => (
    <div data-testid="mock-diagram">
      {Object.entries(props).map(([key, value]) => (
        <div key={key} data-testid={`diagram-prop-${key}`}>
          {JSON.stringify(value)}
        </div>
      ))}
    </div>
  ),
  applyLayout: async (nodes) => {
    return {
      nodes: nodes.map((node, index) => ({
        ...node,
        position: { x: (index + 1) * 100, y: (index + 1) * 100 },
      })),
    };
  },
};
(require.cache[require.resolve('@mongodb-js/diagramming')] as any).exports =
  mockDiagramming;

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
import type {
  Edit,
  MongoDBDataModelDescription,
} from '../services/data-model-storage';
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
              displayPosition: [-1, -1],
              shardKey: {},
              jsonSchema: { bsonType: 'object' },
            },
            {
              ns: 'db1.collection2',
              indexes: [],
              displayPosition: [-1, -1],
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
    await waitFor(() => {
      expect(screen.getByTestId('model-preview')).to.be.visible;
    });
  });

  it('applies the initial layout to unpositioned nodes', async function () {
    const state = store.getState();

    expect(state.diagram?.edits.current).to.have.lengthOf(1);
    expect(state.diagram?.edits.current[0].type).to.equal('SetModel');
    const initialEdit = state.diagram?.edits.current[0] as Extract<
      Edit,
      { type: 'SetModel' }
    >;
    expect(initialEdit.model?.collections[0].displayPosition).to.deep.equal([
      100, 100,
    ]);
    expect(initialEdit.model?.collections[1].displayPosition).to.deep.equal([
      200, 200,
    ]);
  });
});
