import { expect } from 'chai';
import { type DataModelingStore, setupStore } from '../../test/setup-store';
import {
  applyEdit,
  getCurrentDiagramFromState,
  getCurrentModel,
  openDiagram,
  redoEdit,
  undoEdit,
} from './diagram';
import type {
  Edit,
  MongoDBDataModelDescription,
  StaticModel,
} from '../services/data-model-storage';
import { UUID } from 'bson';

const model: StaticModel = {
  collections: [
    {
      ns: 'collection1',
      indexes: [],
      displayPosition: [0, 0],
      shardKey: {},
      jsonSchema: { bsonType: 'object' },
    },
    {
      ns: 'collection2',
      indexes: [],
      displayPosition: [1, 1],
      shardKey: {},
      jsonSchema: { bsonType: 'object' },
    },
  ],
  relationships: [
    {
      id: new UUID().toString(),
      relationship: [
        {
          ns: 'db.sourceCollection',
          cardinality: 1,
          fields: ['field1'],
        },
        {
          ns: 'db.targetCollection',
          cardinality: 1,
          fields: ['field2'],
        },
      ],
      isInferred: false,
    },
  ],
};

const loadedDiagram: MongoDBDataModelDescription = {
  id: 'diagram-id',
  name: 'diagram-name',
  connectionId: 'connection-id',
  createdAt: '2023-10-01T00:00:00.000Z',
  updatedAt: '2023-10-05T00:00:00.000Z',
  edits: [{ type: 'SetModel', model } as Edit],
};

describe('Data Modeling store', function () {
  let store: DataModelingStore;

  beforeEach(function () {
    store = setupStore();
  });

  describe('New Diagram', function () {
    it('handles analysis finished + initial positions', function () {
      // ANALYSIS FINISHED
      const newDiagram = {
        name: 'New Diagram',
        connectionId: 'connection-id',
        collections: [
          {
            ns: 'collection1',
            schema: model.collections[0].jsonSchema,
            position: { x: 0, y: 0 },
          },
          {
            ns: 'collection2',
            schema: model.collections[1].jsonSchema,
            position: { x: 0, y: 0 },
          },
        ],
        relations: model.relationships,
      };
      store.dispatch({
        type: 'data-modeling/analysis-stats/ANALYSIS_FINISHED',
        ...newDiagram,
      });

      const initialDiagram = getCurrentDiagramFromState(store.getState());
      expect(initialDiagram.name).to.equal(newDiagram.name);
      expect(initialDiagram.connectionId).to.equal(newDiagram.connectionId);
      expect(initialDiagram.edits).to.have.length(1);
      expect(initialDiagram.edits[0].type).to.equal('SetModel');
      const initialEdit = initialDiagram.edits[0] as Extract<
        Edit,
        { type: 'SetModel' }
      >;
      expect(initialEdit.model.collections[0]).to.deep.include({
        ns: newDiagram.collections[0].ns,
        jsonSchema: newDiagram.collections[0].schema,
        displayPosition: [0, 0],
      });
      expect(initialEdit.model.collections[1]).to.deep.include({
        ns: newDiagram.collections[1].ns,
        jsonSchema: newDiagram.collections[1].schema,
        displayPosition: [0, 0],
      });
      expect(initialEdit.model.relationships).to.deep.equal(
        newDiagram.relations
      );
    });
  });

  describe('Existing Diagram', function () {
    it('openDiagram', function () {
      store.dispatch(openDiagram(loadedDiagram));

      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.id).to.equal(loadedDiagram.id);
      expect(diagram.name).to.equal(loadedDiagram.name);
      expect(diagram.connectionId).to.equal(loadedDiagram.connectionId);
      expect(diagram.edits).to.deep.equal(loadedDiagram.edits);
    });
  });

  describe('Editing', function () {
    it('should apply a valid SetModel edit', function () {
      store.dispatch(openDiagram(loadedDiagram));

      const edit = {
        type: 'SetModel' as const,
        model: {
          collections: [
            {
              ns: 'collection2',
              indexes: [],
              displayPosition: [0, 0],
              shardKey: {},
              jsonSchema: { bsonType: 'object' },
            },
          ] as StaticModel['collections'],
          relationships: [] as StaticModel['relationships'],
        },
      };
      store.dispatch(applyEdit(edit));

      const state = store.getState();
      const diagram = getCurrentDiagramFromState(state);
      expect(state.diagram?.editErrors).to.be.undefined;
      expect(diagram.edits).to.have.length(2);
      expect(diagram.edits[0]).to.deep.equal(loadedDiagram.edits[0]);
      expect(diagram.edits[1]).to.deep.include(edit);
    });

    it('should apply a valid AddRelationship edit', function () {
      store.dispatch(openDiagram(loadedDiagram));

      const relationshipId = new UUID().toString();
      const newRelationship: StaticModel['relationships'][number] = {
        id: relationshipId,
        relationship: [
          {
            ns: 'db.sourceCollection',
            cardinality: 1,
            fields: ['field1'],
          },
          {
            ns: 'db.targetCollection',
            cardinality: 1,
            fields: ['field2'],
          },
        ],
        isInferred: false,
      };

      store.dispatch(
        applyEdit({
          type: 'AddRelationship',
          relationship: newRelationship,
        } as Edit)
      );

      const state = store.getState();
      const diagram = getCurrentDiagramFromState(state);
      expect(state.diagram?.editErrors).to.be.undefined;
      expect(diagram.edits).to.have.length(2);
      expect(diagram.edits[0]).to.deep.equal(loadedDiagram.edits[0]);
      expect(diagram.edits[1]).to.deep.include({
        type: 'AddRelationship',
        relationship: newRelationship,
      });

      const currentModel = getCurrentModel(diagram.edits);
      expect(currentModel.relationships).to.have.length(2);
    });

    it('should not apply invalid AddRelationship edit', function () {
      store.dispatch(openDiagram(loadedDiagram));

      const edit = {
        type: 'AddRelationship',
        relationship: {
          id: new UUID().toString(),
          isInferred: false,
        },
      } as unknown as Edit;
      store.dispatch(applyEdit(edit));

      const editErrors = store.getState().diagram?.editErrors;
      expect(editErrors).to.have.length(1);
      expect(editErrors && editErrors[0]).to.equal(
        "'relationship,relationship' is required"
      );
      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.edits).to.deep.equal(loadedDiagram.edits);
    });

    it('should apply a valid MoveCollection edit', function () {
      store.dispatch(openDiagram(loadedDiagram));

      const edit: Omit<
        Extract<Edit, { type: 'MoveCollection' }>,
        'id' | 'timestamp'
      > = {
        type: 'MoveCollection',
        ns: model.collections[0].ns,
        newPosition: [100, 100],
      };
      store.dispatch(applyEdit(edit));

      const state = store.getState();
      const diagram = getCurrentDiagramFromState(state);
      expect(state.diagram?.editErrors).to.be.undefined;
      expect(diagram.edits).to.have.length(2);
      expect(diagram.edits[0]).to.deep.equal(loadedDiagram.edits[0]);
      expect(diagram.edits[1]).to.deep.include(edit);

      const currentModel = getCurrentModel(diagram.edits);
      expect(currentModel.collections[0].displayPosition).to.deep.equal([
        100, 100,
      ]);
    });

    it('should not apply invalid MoveCollection edit', function () {
      store.dispatch(openDiagram(loadedDiagram));

      const edit = {
        type: 'MoveCollection',
        ns: 'nonexistent.collection',
      } as unknown as Edit;
      store.dispatch(applyEdit(edit));

      const editErrors = store.getState().diagram?.editErrors;
      expect(editErrors).to.have.length(1);
      expect(editErrors && editErrors[0]).to.equal("'newPosition' is required");
      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.edits).to.deep.equal(loadedDiagram.edits);
    });
  });

  it('undo & redo', function () {
    store.dispatch(openDiagram(loadedDiagram));

    const edit = {
      type: 'SetModel',
      model: {
        ...model,
        relationships: [] as StaticModel['relationships'],
      },
    } as Edit;
    store.dispatch(applyEdit(edit));

    const diagramAfterEdit = getCurrentDiagramFromState(store.getState());
    expect(diagramAfterEdit.edits).to.have.length(2);
    expect(diagramAfterEdit.edits[0]).to.deep.include(loadedDiagram.edits[0]);
    expect(diagramAfterEdit.edits[1]).to.deep.include(edit);

    store.dispatch(undoEdit());

    const diagramAfterUndo = getCurrentDiagramFromState(store.getState());
    expect(diagramAfterUndo.edits).to.have.length(1);
    expect(diagramAfterUndo.edits[0]).to.deep.include(loadedDiagram.edits[0]);

    store.dispatch(redoEdit());

    const diagramAfterRedo = getCurrentDiagramFromState(store.getState());
    expect(diagramAfterRedo.edits).to.have.length(2);
    expect(diagramAfterRedo.edits[0]).to.deep.include(loadedDiagram.edits[0]);
    expect(diagramAfterRedo.edits[1]).to.deep.include(edit);
  });
});
