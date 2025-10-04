import React from 'react';
import { expect } from 'chai';
import {
  createDefaultConnectionInfo,
  createPluginTestHelpers,
  screen,
  userEvent,
  waitFor,
  within,
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
import { DrawerAnchor } from '@mongodb-js/compass-components';
import { type AnalysisOptions, startAnalysis } from '../store/analysis-process';
import type { DataService } from '@mongodb-js/compass-connections/provider';

const mockConnections = [
  { ...createDefaultConnectionInfo(), id: 'connection1' },
  { ...createDefaultConnectionInfo(), id: 'connection2' },
];

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
          {typeof value === 'object' ? 'object' : JSON.stringify(value)}
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

const renderDiagramEditor = async ({
  existingDiagram,
  newDiagram,
}:
  | {
      existingDiagram: MongoDBDataModelDescription;
      newDiagram?: never;
    }
  | {
      newDiagram: {
        name: string;
        database: string;
        connectionId: string;
        collections: string[];
        analysisOptions: AnalysisOptions;
      };
      existingDiagram?: never;
    }) => {
  const mockDataModelStorage = {
    status: 'READY',
    error: null,
    items: storageItems,
    save: () => {
      return Promise.resolve(false);
    },
    delete: () => {
      return Promise.resolve(false);
    },
    loadAll: () => Promise.resolve(storageItems),
    load: (id: string) => {
      return Promise.resolve(storageItems.find((x) => x.id === id) ?? null);
    },
  };

  const { renderWithActiveConnection } = createPluginTestHelpers(
    DataModelingWorkspaceTab.provider.withMockServices({
      services: {
        dataModelStorage: mockDataModelStorage,
      },
    }),
    {
      namespace: 'foo.bar',
    }
  );
  const {
    plugin: { store },
  } = await renderWithActiveConnection(
    <DrawerAnchor>
      <DiagramProvider fitView>
        <DiagramEditor />
      </DiagramProvider>
    </DrawerAnchor>,
    mockConnections[0],
    {
      connections: mockConnections,
      connectFn: () => {
        return {
          sample: () =>
            Promise.resolve([
              {
                _id: 'doc1',
              },
              {
                _id: 'doc2',
              },
            ]),
        } as unknown as DataService;
      },
    }
  );
  if (existingDiagram) store.dispatch(openDiagram(existingDiagram));
  if (newDiagram)
    store.dispatch(
      startAnalysis(
        newDiagram.name,
        newDiagram.connectionId,
        newDiagram.database,
        newDiagram.collections,
        newDiagram.analysisOptions
      )
    );

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
      const result = await renderDiagramEditor({
        existingDiagram: storageItems[0],
      });
      store = result.store;

      // wait till the editor is loaded
      await waitFor(() => {
        expect(screen.getByTestId('model-preview')).to.be.visible;
      });
    });

    it('does not show the banner', function () {
      expect(screen.queryByText('Worried about your data?')).not.to.exist;
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

  context('with a new diagram', function () {
    beforeEach(async function () {
      const result = await renderDiagramEditor({
        newDiagram: {
          name: 'New Diagram',
          database: 'test',
          connectionId: 'connection1',
          collections: ['collection1', 'collection2'],
          analysisOptions: {
            automaticallyInferRelations: false,
          },
        },
      });
      store = result.store;

      // wait till the editor is loaded
      await waitFor(() => {
        expect(screen.getByTestId('model-preview')).to.be.visible;
      });
    });

    it('shows the banner', function () {
      expect(screen.getByText('Questions about your data?')).to.be.visible;
    });

    it('banner can be closed', function () {
      const closeBtn = within(screen.getByTestId('data-info-banner')).getByRole(
        'button',
        { name: 'Close Message' }
      );
      expect(closeBtn).to.be.visible;
      userEvent.click(closeBtn);
      expect(screen.queryByText('Questions about your data?')).not.to.exist;
    });
  });
});
