import { expect } from 'chai';
import type {
  StaticModel,
  Edit,
  MongoDBDataModelDescription,
  Relationship,
} from '../services/data-model-storage';
import { UUID } from 'bson';
import { getModelFromReanalysis } from './analysis-process';
import { type DataModelingStore, setupStore } from '../../test/setup-store';
import {
  createNewRelationship,
  deleteCollection,
  deleteRelationship,
  moveCollection,
  openDiagram,
  updateRelationship,
} from './diagram';

function getMockedCollection(ns: string) {
  return {
    ns,
    position: {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
    },
    schema: { bsonType: 'object' },
    isExpanded: true,
  };
}

function getMockedRelationship(
  sourceNs: string,
  targetNs: string
): Relationship {
  return {
    id: new UUID().toString(),
    relationship: [
      {
        ns: sourceNs,
        cardinality: 1,
        fields: ['field1'],
      },
      {
        ns: targetNs,
        cardinality: 1,
        fields: ['field2'],
      },
    ],
    isInferred: false,
  };
}

const model: StaticModel = {
  collections: [
    {
      ns: 'db.collection1',
      indexes: [],
      displayPosition: [1, 1],
      shardKey: {},
      jsonSchema: { bsonType: 'object' },
      isExpanded: true,
    },
    {
      ns: 'db.collection2',
      indexes: [],
      displayPosition: [2, 2],
      shardKey: {},
      jsonSchema: { bsonType: 'object' },
      isExpanded: true,
    },
    {
      ns: 'db.collection3',
      indexes: [],
      displayPosition: [3, 3],
      shardKey: {},
      jsonSchema: { bsonType: 'object' },
      isExpanded: true,
    },
  ],
  relationships: [getMockedRelationship('db.collection1', 'db.collection2')],
};

const mockDiagram: MongoDBDataModelDescription = {
  id: 'diagram-id',
  name: 'diagram-name',
  connectionId: 'connection-id',
  database: 'db',
  createdAt: '2023-10-01T00:00:00.000Z',
  updatedAt: '2023-10-05T00:00:00.000Z',
  edits: [{ type: 'SetModel', model } as Edit],
};

describe('analysis-process', function () {
  context('getModelFromReanalysis', function () {
    let store: DataModelingStore;
    beforeEach(function () {
      store = setupStore();
      store.dispatch(openDiagram(mockDiagram));
    });
    context('relationships', function () {
      it('should retain deletes', function () {
        store.dispatch(deleteRelationship(model.relationships[0].id));
        const edits = store.getState().diagram?.edits.current;
        const relationships = [
          getMockedRelationship('db.collection3', 'db.collection4'),
        ];
        const newModel = getModelFromReanalysis(
          edits as [Edit, ...Edit[]],
          [],
          relationships
        );
        expect(newModel.collections).to.deep.equal(model.collections);
        expect(newModel.relationships).to.deep.equal(relationships);
      });
      it('should retain any edits', function () {
        store.dispatch(
          updateRelationship({
            ...model.relationships[0],
            relationship: [
              model.relationships[0].relationship[0],
              {
                ...model.relationships[0].relationship[1],
                ns: 'db.collection3',
              },
            ],
          })
        );
        const edits = store.getState().diagram?.edits.current;
        const relationships = [
          getMockedRelationship('db.collection3', 'db.collection4'),
        ];
        const newModel = getModelFromReanalysis(
          edits as [Edit, ...Edit[]],
          [],
          relationships
        );
        expect(newModel.collections).to.deep.equal(model.collections);
        expect(newModel.relationships).to.deep.equal([
          {
            ...model.relationships[0],
            relationship: [
              model.relationships[0].relationship[0],
              {
                ...model.relationships[0].relationship[1],
                ns: 'db.collection3',
              },
            ],
          },
          ...relationships,
        ]);
      });
      it('should not include a relation that was added in SetModel and then removed', function () {
        store.dispatch(deleteRelationship(model.relationships[0].id));
        const edits = store.getState().diagram?.edits.current;
        const relationships = [
          // Let's add it back
          getMockedRelationship(
            model.relationships[0].relationship[0].ns!,
            model.relationships[0].relationship[1].ns!
          ),
        ];
        const newModel = getModelFromReanalysis(
          edits as [Edit, ...Edit[]],
          [],
          relationships
        );
        expect(newModel.collections).to.deep.equal(model.collections);
        expect(newModel.relationships).to.deep.equal([]);
      });
      it('should retain a relation that was added after SetModel edit', function () {
        store.dispatch(
          createNewRelationship({
            localNamespace: 'db.collection6',
            foreignNamespace: 'db.collection7',
            localFields: ['fieldA'],
            foreignFields: ['fieldB'],
          })
        );
        const edits = store.getState().diagram?.edits.current;
        const relationships = [
          getMockedRelationship('db.collection3', 'db.collection4'),
        ];
        const newModel = getModelFromReanalysis(
          edits as [Edit, ...Edit[]],
          [],
          relationships
        );
        expect(newModel.collections).to.deep.equal(model.collections);

        // Added via dispatch (createNewRelationship)
        const indexOfAddedRelation = newModel.relationships.findIndex(
          (rel) =>
            rel.relationship[0].ns === 'db.collection6' &&
            rel.relationship[1].ns === 'db.collection7'
        );

        expect(indexOfAddedRelation).to.be.greaterThan(-1);
        const otherRelationships = newModel.relationships.filter(
          (_, idx) => idx !== indexOfAddedRelation
        );

        expect(otherRelationships).to.deep.equal([
          ...model.relationships,
          ...relationships,
        ]);
      });
    });
    context('collections', function () {
      it('should retain deletes', function () {
        store.dispatch(deleteCollection(model.collections[2].ns));
        const edits = store.getState().diagram?.edits.current;
        const collections = [getMockedCollection('db.collection4')];
        const newModel = getModelFromReanalysis(
          edits as Edit[],
          collections,
          []
        );
        expect(newModel.relationships).to.deep.equal(model.relationships);
        expect(newModel.collections).to.deep.equal([
          model.collections[0],
          model.collections[1],
          ...collections.map((c) => ({
            ns: c.ns,
            indexes: [],
            displayPosition: [c.position.x, c.position.y],
            shardKey: undefined,
            jsonSchema: c.schema,
            isExpanded: true,
          })),
        ]);
      });
      it('should retain any edits', function () {
        store.dispatch(moveCollection(model.collections[0].ns, [10, 10]));
        const edits = store.getState().diagram?.edits.current;
        const collections = [getMockedCollection('db.collection4')];
        const newModel = getModelFromReanalysis(
          edits as Edit[],
          collections,
          []
        );
        expect(newModel.relationships).to.deep.equal(model.relationships);
        expect(newModel.collections).to.deep.equal([
          {
            ...model.collections[0],
            displayPosition: [10, 10],
          },
          model.collections[1],
          model.collections[2],
          ...collections.map((c) => ({
            ns: c.ns,
            indexes: [],
            displayPosition: [c.position.x, c.position.y],
            shardKey: undefined,
            jsonSchema: c.schema,
            isExpanded: true,
          })),
        ]);
      });
    });
  });
});
