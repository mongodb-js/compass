import React from 'react';
import { expect } from 'chai';
import {
  createPluginTestHelpers,
  screen,
  waitFor,
  render,
  userEvent,
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
import { getFieldsFromSchema } from '../utils/nodes-and-edges';

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
              displayPosition: [0, 0],
              shardKey: {},
              jsonSchema: { bsonType: 'object' },
            },
            {
              ns: 'db1.collection2',
              indexes: [],
              displayPosition: [0, 0],
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

describe('getFieldsFromSchema', function () {
  const validateMixedType = async (
    type: React.ReactNode,
    expectedTooltip: RegExp
  ) => {
    render(<>{type}</>);
    const mixed = screen.getByText('(mixed)');
    expect(mixed).to.be.visible;
    expect(screen.queryByText(expectedTooltip)).to.not.exist;
    userEvent.hover(mixed);
    await waitFor(() => {
      expect(screen.getByText(expectedTooltip)).to.be.visible;
    });
  };

  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getFieldsFromSchema({});
      expect(result).to.deep.equal([]);
    });

    it('returns fields for a simple schema', function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          name: { bsonType: 'string' },
          age: { bsonType: 'int' },
        },
      });
      expect(result).to.deep.equal([
        {
          name: 'name',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        { name: 'age', type: 'int', depth: 0, glyphs: [], variant: undefined },
      ]);
    });

    it('returns mixed fields with tooltip on hover', async function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          age: { bsonType: ['int', 'string'] },
        },
      });
      expect(result[0]).to.deep.include({
        name: 'age',
        depth: 0,
        glyphs: [],
        variant: undefined,
      });
      await validateMixedType(result[0].type, /int, string/);
    });

    it('highlights the correct field', function () {
      const result = getFieldsFromSchema(
        {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: 'int' },
            profession: { bsonType: 'string' },
          },
        },
        ['age']
      );
      expect(result).to.deep.equal([
        {
          name: 'name',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        { name: 'age', type: 'int', depth: 0, glyphs: [], variant: 'preview' },
        {
          name: 'profession',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });
  });

  describe('nested schema', function () {
    it('returns fields for a nested schema', function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          person: {
            bsonType: 'object',
            properties: {
              name: { bsonType: 'string' },
              address: {
                bsonType: 'object',
                properties: {
                  street: { bsonType: 'string' },
                  city: { bsonType: 'string' },
                },
              },
            },
          },
        },
      });
      expect(result).to.deep.equal([
        {
          name: 'person',
          type: 'object',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'name',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'address',
          type: 'object',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'street',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'city',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });

    it('highlights a field for a nested schema', function () {
      const result = getFieldsFromSchema(
        {
          bsonType: 'object',
          properties: {
            person: {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
                address: {
                  bsonType: 'object',
                  properties: {
                    street: { bsonType: 'string' },
                    city: { bsonType: 'string' },
                  },
                },
              },
            },
          },
        },
        ['person', 'address', 'street']
      );
      expect(result).to.deep.equal([
        {
          name: 'person',
          type: 'object',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'name',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'address',
          type: 'object',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'street',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: 'preview',
        },
        {
          name: 'city',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });

    it('returns [] for array', function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          tags: {
            bsonType: 'array',
            items: { bsonType: 'string' },
          },
        },
      });
      expect(result).to.deep.equal([
        { name: 'tags', type: '[]', depth: 0, glyphs: [], variant: undefined },
      ]);
    });

    it('returns fields for an array of objects', function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          todos: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              properties: {
                title: { bsonType: 'string' },
                completed: { bsonType: 'boolean' },
              },
            },
          },
        },
      });
      expect(result).to.deep.equal([
        { name: 'todos', type: '[]', depth: 0, glyphs: [], variant: undefined },
        {
          name: 'title',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'completed',
          type: 'boolean',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });

    it('returns fields for a mixed schema with objects', async function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          name: {
            anyOf: [
              { bsonType: 'string' },
              {
                bsonType: 'object',
                properties: {
                  first: { bsonType: 'string' },
                  last: { bsonType: 'string' },
                },
              },
            ],
          },
        },
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.include({
        name: 'name',
        depth: 0,
        glyphs: [],
        variant: undefined,
      });
      await validateMixedType(result[0].type, /string, object/);
      expect(result[1]).to.deep.equal({
        name: 'first',
        type: 'string',
        depth: 1,
        glyphs: [],
        variant: undefined,
      });
      expect(result[2]).to.deep.equal({
        name: 'last',
        type: 'string',
        depth: 1,
        glyphs: [],
        variant: undefined,
      });
    });

    it('returns fields for an array of mixed (including objects)', function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          todos: {
            bsonType: 'array',
            items: {
              anyOf: [
                {
                  bsonType: 'object',
                  properties: {
                    title: { bsonType: 'string' },
                    completed: { bsonType: 'boolean' },
                  },
                },
                { bsonType: 'string' },
              ],
            },
          },
        },
      });
      expect(result).to.deep.equal([
        { name: 'todos', type: '[]', depth: 0, glyphs: [], variant: undefined },
        {
          name: 'title',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'completed',
          type: 'boolean',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });
  });
});
