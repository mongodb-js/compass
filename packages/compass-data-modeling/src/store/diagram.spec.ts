import { expect } from 'chai';
import { type DataModelingStore, setupStore } from '../../test/setup-store';
import {
  applyEdit,
  getCurrentDiagramFromState,
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
          cardinality: 'one',
          fields: ['field1'],
        },
        {
          ns: 'db.targetCollection',
          cardinality: 'one',
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
  edits: [{ type: 'SetModel', model } as Edit],
};

describe('Data Modeling store', function () {
  let store: DataModelingStore;

  beforeEach(function () {
    store = setupStore();
  });

  it('openDiagram', function () {
    store.dispatch(openDiagram(loadedDiagram));

    const diagram = getCurrentDiagramFromState(store.getState());
    expect(diagram.id).to.equal(loadedDiagram.id);
    expect(diagram.name).to.equal(loadedDiagram.name);
    expect(diagram.connectionId).to.equal(loadedDiagram.connectionId);
    expect(diagram.edits).to.deep.equal(loadedDiagram.edits);
  });

  describe('applyEdit', function () {
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
            cardinality: 'one',
            fields: ['field1'],
          },
          {
            ns: 'db.targetCollection',
            cardinality: 'one',
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
