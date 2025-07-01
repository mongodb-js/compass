import React from 'react';
import { expect } from 'chai';
import {
  createPluginTestHelpers,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import DiagramEditor from './diagram-editor';
import type { DataModelingStore } from '../../test/setup-store';
import type {
  Edit,
  MongoDBDataModelDescription,
} from '../services/data-model-storage';
import diagramming from '@mongodb-js/diagramming';
import sinon from 'sinon';
import { DiagramProvider } from '@mongodb-js/diagramming';
import { DataModelingWorkspaceTab } from '..';
import { openDiagram } from '../store/diagram';

const storageItems: MongoDBDataModelDescription[] = [
  {
    id: 'existing-diagram-id',
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
              displayPosition: [50, 50],
              shardKey: {},
              jsonSchema: { bsonType: 'object' },
            },
            {
              ns: 'db1.collection2',
              indexes: [],
              displayPosition: [150, 150],
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
  {
    id: 'new-diagram-id',
    name: 'Two',
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
              displayPosition: [NaN, NaN],
              shardKey: {},
              jsonSchema: { bsonType: 'object' },
            },
            {
              ns: 'db1.collection2',
              indexes: [],
              displayPosition: [NaN, NaN],
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

const mockDiagramming = {
  // Override Diagram import because it's causing esm/cjs interop issues
  Diagram: (props: any) => (
    <div data-testid="mock-diagram">
      {Object.entries(props).map(([key, value]) => (
        <div key={key} data-testid={`diagram-prop-${key}`}>
          {JSON.stringify(value)}
        </div>
      ))}
    </div>
  ),
  applyLayout: (nodes: any) => {
    return {
      nodes: nodes.map((node: any, index: number) => ({
        ...node,
        position: { x: (index + 1) * 100, y: (index + 1) * 100 },
      })),
    };
  },
};

const renderDiagramEditor = ({
  items = storageItems,
  renderedItem = items[0],
}: {
  items?: MongoDBDataModelDescription[];
  renderedItem?: MongoDBDataModelDescription;
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

  const { renderWithConnections } = createPluginTestHelpers(
    DataModelingWorkspaceTab.provider.withMockServices({
      services: {
        dataModelStorage: mockDataModelStorage,
      },
    }),
    {
      namespace: 'foo.bar',
    } as any
  );
  const {
    plugin: { store },
  } = renderWithConnections(
    <DiagramProvider fitView>
      <DiagramEditor />
    </DiagramProvider>
  );
  store.dispatch(openDiagram(renderedItem));

  return { store };
};

describe('DiagramEditor', function () {
  let store: DataModelingStore;

  before(function () {
    // We need to tub the Diagram import because it has problems with ESM/CJS interop
    sinon.stub(diagramming, 'Diagram').callsFake(mockDiagramming.Diagram);
    sinon
      .stub(diagramming, 'applyLayout')
      .callsFake(mockDiagramming.applyLayout as any);
  });

  context('with initial diagram', function () {
    beforeEach(async function () {
      const result = renderDiagramEditor({
        renderedItem: storageItems[1],
      });
      store = result.store;

      // wait till the editor is loaded
      await waitFor(() => {
        expect(screen.getByTestId('model-preview')).to.be.visible;
      });
    });

    it('applies the initial layout to unpositioned nodes', function () {
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

  context('with existing diagram', function () {
    beforeEach(async function () {
      const result = renderDiagramEditor({
        renderedItem: storageItems[0],
      });
      store = result.store;

      // wait till the editor is loaded
      await waitFor(() => {
        expect(screen.getByTestId('model-preview')).to.be.visible;
      });
    });

    it('does not change the position of the nodes', function () {
      const state = store.getState();

      expect(state.diagram?.edits.current).to.have.lengthOf(1);
      expect(state.diagram?.edits.current[0].type).to.equal('SetModel');
      const initialEdit = state.diagram?.edits.current[0] as Extract<
        Edit,
        { type: 'SetModel' }
      >;
      const storedEdit = storageItems[0].edits[0] as Extract<
        Edit,
        { type: 'SetModel' }
      >;
      expect(initialEdit.model?.collections[0].displayPosition).to.deep.equal(
        storedEdit.model.collections[0].displayPosition
      );
      expect(initialEdit.model?.collections[1].displayPosition).to.deep.equal(
        storedEdit.model.collections[1].displayPosition
      );
    });
  });
});
