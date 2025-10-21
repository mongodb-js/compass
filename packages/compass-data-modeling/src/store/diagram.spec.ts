import { expect } from 'chai';
import { type DataModelingStore, setupStore } from '../../test/setup-store';
import {
  applyEdit,
  getCurrentDiagramFromState,
  getCurrentModel,
  getTypeNameForTelemetry,
  openDiagram,
  redoEdit,
  undoEdit,
  selectFieldsForCurrentModel,
  addCollection,
  renameCollection,
} from './diagram';
import type {
  Edit,
  MongoDBDataModelDescription,
  StaticModel,
} from '../services/data-model-storage';
import { UUID } from 'bson';
import Sinon from 'sinon';

const model: StaticModel = {
  collections: [
    {
      ns: 'db.collection1',
      indexes: [],
      displayPosition: [0, 0],
      shardKey: {},
      jsonSchema: { bsonType: 'object' },
    },
    {
      ns: 'db.collection2',
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
  let openToastSpy: Sinon.SinonSpy;

  beforeEach(function () {
    openToastSpy = Sinon.spy();
    store = setupStore({}, undefined, openToastSpy);
  });

  describe('New Diagram', function () {
    it('handles analysis finished + initial positions', function () {
      // ANALYSIS FINISHED
      const newDiagram = {
        name: 'New Diagram',
        connectionId: 'connection-id',
        collections: [
          {
            ns: 'db.collection1',
            schema: model.collections[0].jsonSchema,
            position: { x: 0, y: 0 },
          },
          {
            ns: 'db.collection2',
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
              ns: 'db.collection2',
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
      expect(openToastSpy).not.to.have.been.called;
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
      expect(openToastSpy).not.to.have.been.called;
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

      expect(openToastSpy).to.have.been.calledOnce;
      expect(openToastSpy.firstCall.args[1].description).to.include(
        "'relationship,relationship' is required"
      );
      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.edits).to.deep.equal(loadedDiagram.edits);
    });

    it('should handle the collection creation flow', function () {
      store.dispatch(openDiagram(loadedDiagram));

      // start creating a new collection
      store.dispatch(addCollection());

      // the new collection is in the diagram
      const diagramAtCreation = getCurrentDiagramFromState(store.getState());
      expect(diagramAtCreation.edits).to.have.length(2);
      const firstAddCollectionEdit = diagramAtCreation.edits[1] as Extract<
        Edit,
        { type: 'AddCollection' }
      >;
      const firstCollectionDraftName = 'db.new-collection';
      expect(firstAddCollectionEdit.type).to.equal('AddCollection');
      expect(firstAddCollectionEdit.ns).to.equal(firstCollectionDraftName);
      expect(firstAddCollectionEdit.initialSchema).to.deep.equal({
        bsonType: 'object',
        properties: {
          _id: {
            bsonType: 'objectId',
          },
        },
        required: ['_id'],
      });

      // the selection changes to the new collection
      const selectedItems = store.getState().diagram?.selectedItems;
      expect(selectedItems).to.deep.equal({
        type: 'collection',
        id: firstCollectionDraftName,
      });

      // name the new collection
      const newCollectionNs = 'db.myCollection';
      store.dispatch(
        renameCollection(firstCollectionDraftName, newCollectionNs)
      );

      // now the collection is added to the edit history
      const diagramAfterCreation = getCurrentDiagramFromState(store.getState());
      expect(diagramAfterCreation.edits).to.have.length(2);
      expect(diagramAfterCreation.edits[0]).to.deep.equal(
        loadedDiagram.edits[0]
      );
      const addCollectionEdit = diagramAfterCreation.edits[1] as Extract<
        Edit,
        { type: 'AddCollection' }
      >;
      expect(addCollectionEdit.type).to.equal('AddCollection');
      expect(addCollectionEdit.ns).to.equal(newCollectionNs);
      expect(addCollectionEdit.initialSchema).to.deep.equal({
        bsonType: 'object',
        properties: {
          _id: {
            bsonType: 'objectId',
          },
        },
        required: ['_id'],
      });

      // and it is selected
      const selectedItemsAfterCreation =
        store.getState().diagram?.selectedItems;
      expect(selectedItemsAfterCreation).to.deep.equal({
        type: 'collection',
        id: newCollectionNs,
      });
    });

    it('should iterate the names for new collections', function () {
      store.dispatch(openDiagram(loadedDiagram));

      // start creating a new collection
      store.dispatch(addCollection());

      // creates the first collection and makes it selected
      const firstCollectionDraftName = 'db.new-collection';
      const diagram1 = getCurrentDiagramFromState(store.getState());
      expect(diagram1.edits).to.have.length(2);
      const firstAddCollectionEdit = diagram1.edits[1] as Extract<
        Edit,
        { type: 'AddCollection' }
      >;
      expect(firstAddCollectionEdit.type).to.equal('AddCollection');
      expect(firstAddCollectionEdit.ns).to.equal(firstCollectionDraftName);
      const selectedItems1 = store.getState().diagram?.selectedItems;
      expect(selectedItems1).to.deep.equal({
        type: 'collection',
        id: firstCollectionDraftName,
      });

      // start creating another new collection
      store.dispatch(addCollection());

      // creates the second collection and makes it selected
      const secondCollectionDraftName = 'db.new-collection-1';
      const diagramAtCreation = getCurrentDiagramFromState(store.getState());
      expect(diagramAtCreation.edits).to.have.length(3);
      const secondAddCollectionEdit = diagramAtCreation.edits[2] as Extract<
        Edit,
        { type: 'AddCollection' }
      >;
      expect(secondAddCollectionEdit.type).to.equal('AddCollection');
      expect(secondAddCollectionEdit.ns).to.equal(secondCollectionDraftName);
      const selectedItems2 = store.getState().diagram?.selectedItems;
      expect(selectedItems2).to.deep.equal({
        type: 'collection',
        id: secondCollectionDraftName,
      });
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
      expect(openToastSpy).not.to.have.been.called;
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

      expect(openToastSpy).to.have.been.calledOnce;
      expect(openToastSpy.firstCall.args[1].description).to.include(
        "'newPosition' is required"
      );
      const diagram = getCurrentDiagramFromState(store.getState());
      expect(diagram.edits).to.deep.equal(loadedDiagram.edits);
    });

    it('should handle an invalid RenameCollection edit', function () {
      store.dispatch(openDiagram(loadedDiagram));
      store.dispatch(renameCollection('nonExisting', 'newName'));
      expect(openToastSpy).to.have.been.calledOnce;
      expect(openToastSpy.firstCall.args[1].description).to.include(
        "Collection 'nonExisting' not found"
      );
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

  describe('selectFieldsForCurrentModel', function () {
    it('should select fields from a flat schema', function () {
      const edits: MongoDBDataModelDescription['edits'] = [
        {
          id: 'first-edit',
          timestamp: new Date().toISOString(),
          type: 'SetModel',
          model: {
            collections: [
              {
                ns: 'db.collection1',
                indexes: [],
                displayPosition: [0, 0],
                shardKey: {},
                jsonSchema: {
                  bsonType: 'object',
                  properties: {
                    field1: { bsonType: 'string' },
                    field2: { bsonType: 'int' },
                    field3: { bsonType: 'int' },
                  },
                },
              },
            ],
            relationships: [],
          },
        },
      ];
      const selectedFields = selectFieldsForCurrentModel(edits);

      expect(selectedFields).to.deep.equal({
        'db.collection1': [['field1'], ['field2'], ['field3']],
      });
    });

    it('should select fields from a nested schema', function () {
      const edits: MongoDBDataModelDescription['edits'] = [
        {
          id: 'first-edit',
          timestamp: new Date().toISOString(),
          type: 'SetModel',
          model: {
            collections: [
              {
                ns: 'db.collection1',
                indexes: [],
                displayPosition: [0, 0],
                shardKey: {},
                jsonSchema: {
                  bsonType: 'object',
                  properties: {
                    prop1: { bsonType: 'string' },
                    // Deeply nested properties
                    prop2: {
                      bsonType: 'object',
                      properties: {
                        prop2A: { bsonType: 'string' },
                        prop2B: {
                          bsonType: 'object',
                          properties: {
                            prop2B1: { bsonType: 'string' },
                            prop2B2: { bsonType: 'int' },
                          },
                        },
                      },
                    },
                    // Array of objects
                    prop3: {
                      bsonType: 'array',
                      items: {
                        bsonType: 'object',
                        properties: {
                          prop3A: { bsonType: 'string' },
                        },
                      },
                    },
                    // Mixed type with objects
                    prop4: {
                      anyOf: [
                        {
                          bsonType: 'object',
                          properties: {
                            prop4A: { bsonType: 'string' },
                          },
                        },
                        {
                          bsonType: 'object',
                          properties: {
                            prop4B: { bsonType: 'string' },
                          },
                        },
                      ],
                    },
                    // Mixed array with objects
                    prop5: {
                      bsonType: 'array',
                      items: [
                        {
                          bsonType: 'object',
                          properties: {
                            prop5A: { bsonType: 'string' },
                          },
                        },
                        {
                          bsonType: 'object',
                          properties: {
                            prop5B: { bsonType: 'number' },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
            relationships: [],
          },
        },
      ];
      const selectedFields = selectFieldsForCurrentModel(edits);
      expect(selectedFields).to.have.property('db.collection1');
      expect(selectedFields['db.collection1']).to.deep.include(['prop1']);
      expect(selectedFields['db.collection1']).to.deep.include(['prop2']);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop2',
        'prop2A',
      ]);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop2',
        'prop2B',
        'prop2B1',
      ]);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop2',
        'prop2B',
        'prop2B2',
      ]);
      expect(selectedFields['db.collection1']).to.deep.include(['prop3']);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop3',
        'prop3A',
      ]);
      expect(selectedFields['db.collection1']).to.deep.include(['prop4']);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop4',
        'prop4A',
      ]);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop4',
        'prop4B',
      ]);
      expect(selectedFields['db.collection1']).to.deep.include(['prop5']);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop5',
        'prop5A',
      ]);
      expect(selectedFields['db.collection1']).to.deep.include([
        'prop5',
        'prop5B',
      ]);
    });
  });
});

describe('getTypeNameForTelemetry', () => {
  it('should return undefined when bsonType is undefined', () => {
    const result = getTypeNameForTelemetry(undefined);
    expect(result).to.be.undefined;
  });

  it('should return undefined when bsonType is an empty array', () => {
    const result = getTypeNameForTelemetry([]);
    expect(result).to.be.undefined;
  });

  it('should return the string when bsonType is a string', () => {
    const result = getTypeNameForTelemetry('string');
    expect(result).to.equal('string');
  });

  it('should return the single element when bsonType is an array with one element', () => {
    const result = getTypeNameForTelemetry(['string']);
    expect(result).to.equal('string');
  });

  it('should return "mixed" when bsonType is an array with multiple elements', () => {
    const result = getTypeNameForTelemetry(['string', 'number']);
    expect(result).to.equal('mixed');
  });
});
