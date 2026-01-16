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
  addNewFieldToCollection,
  createNewRelationship,
  deleteCollection,
  deleteRelationship,
  openDiagram,
  updateRelationship,
  selectCurrentModelFromState,
} from './diagram';

const mockSchema = {
  bsonType: 'object',
  required: ['_id'],
  properties: {
    _id: {
      bsonType: 'objectId',
    },
  },
};
function getMockedCollection(ns: string) {
  return {
    ns,
    position: {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
    },
    schema: mockSchema,
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
        fields: ['_id'],
      },
      {
        ns: targetNs,
        cardinality: 1,
        fields: ['_id'],
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
      jsonSchema: mockSchema,
      isExpanded: true,
    },
    {
      ns: 'db.collection2',
      indexes: [],
      displayPosition: [2, 2],
      shardKey: {},
      jsonSchema: mockSchema,
      isExpanded: true,
    },
    {
      ns: 'db.collection3',
      indexes: [],
      displayPosition: [3, 3],
      shardKey: {},
      jsonSchema: mockSchema,
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
      it('should retain deletes', async function () {
        store.dispatch(deleteRelationship(model.relationships[0].id));
        const currentModel = selectCurrentModelFromState(store.getState());
        const relationships = [
          getMockedRelationship('db.collection3', 'db.collection4'),
        ];
        const newModel = await getModelFromReanalysis(
          currentModel,
          [
            getMockedCollection('db.collection1'),
            getMockedCollection('db.collection2'),
            getMockedCollection('db.collection3'),
            getMockedCollection('db.collection4'),
          ],
          [...model.relationships, ...relationships]
        );
        expect(newModel.collections).to.have.lengthOf(4);
        expect(newModel.relationships).to.deep.equal(relationships);
      });
      it('should retain any edits', async function () {
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
        const currentModel = selectCurrentModelFromState(store.getState());
        const relationships = [
          getMockedRelationship('db.collection3', 'db.collection4'),
        ];
        const newModel = await getModelFromReanalysis(
          currentModel,
          [
            getMockedCollection('db.collection1'),
            getMockedCollection('db.collection2'),
            getMockedCollection('db.collection3'),
            getMockedCollection('db.collection4'),
          ],
          [...model.relationships, ...relationships]
        );
        expect(newModel.collections).to.have.lengthOf(4);
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
      it('should not include a relation that was added in SetModel and then removed', async function () {
        store.dispatch(deleteRelationship(model.relationships[0].id));
        const currentModel = selectCurrentModelFromState(store.getState());
        const relationships = [
          // Let's add it back
          getMockedRelationship(
            model.relationships[0].relationship[0].ns!,
            model.relationships[0].relationship[1].ns!
          ),
        ];
        const newModel = await getModelFromReanalysis(
          currentModel,
          [
            getMockedCollection('db.collection1'),
            getMockedCollection('db.collection2'),
            getMockedCollection('db.collection3'),
          ],
          [...model.relationships, ...relationships]
        );
        expect(newModel.collections).to.have.lengthOf(3);
        expect(newModel.relationships).to.deep.equal([]);
      });
      it('should retain a relation that was added after SetModel edit', async function () {
        store.dispatch(
          createNewRelationship({
            localNamespace: 'db.collection6',
            foreignNamespace: 'db.collection7',
            localFields: ['fieldA'],
            foreignFields: ['fieldB'],
          })
        );
        const currentModel = selectCurrentModelFromState(store.getState());
        const relationships = [
          getMockedRelationship('db.collection3', 'db.collection4'),
        ];
        const newModel = await getModelFromReanalysis(
          currentModel,
          [
            getMockedCollection('db.collection1'),
            getMockedCollection('db.collection2'),
            getMockedCollection('db.collection3'),
            getMockedCollection('db.collection4'),
          ],
          [...model.relationships, ...relationships]
        );
        expect(newModel.collections).to.have.lengthOf(4);
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
      it('should retain deletes - when user does not select deleted collection', async function () {
        store.dispatch(deleteCollection(model.collections[2].ns));
        const currentModel = selectCurrentModelFromState(store.getState());
        const collections = [
          getMockedCollection('db.collection1'),
          getMockedCollection('db.collection2'),
          // db.collection3 is deleted one
          getMockedCollection('db.collection4'),
        ];
        const newModel = await getModelFromReanalysis(
          currentModel,
          collections,
          model.relationships
        );
        expect(newModel.relationships).to.deep.equal(model.relationships);

        expect(newModel.collections.map((c) => c.ns)).to.have.members(
          collections.map((c) => c.ns)
        );
      });
      it('should include collection when user reselects it after deleting', async function () {
        store.dispatch(deleteCollection(model.collections[2].ns));
        const currentModel = selectCurrentModelFromState(store.getState());
        const collections = [
          getMockedCollection('db.collection1'),
          getMockedCollection('db.collection2'),
          getMockedCollection('db.collection3'),
          getMockedCollection('db.collection4'),
        ];
        const newModel = await getModelFromReanalysis(
          currentModel,
          collections,
          model.relationships
        );
        expect(newModel.relationships).to.deep.equal(model.relationships);

        expect(newModel.collections.map((c) => c.ns)).to.have.members(
          collections.map((c) => c.ns)
        );
      });
      it('should retain any edits', async function () {
        store.dispatch(
          addNewFieldToCollection(model.collections[0].ns, 'diagram')
        );
        const currentModel = selectCurrentModelFromState(store.getState());
        const newFields = Object.keys(
          currentModel.collections.find((c) => c.ns === model.collections[0].ns)
            ?.jsonSchema?.properties || {}
        );

        const collections = [
          getMockedCollection('db.collection1'),
          getMockedCollection('db.collection2'),
          getMockedCollection('db.collection3'),
          getMockedCollection('db.collection4'),
        ];
        const newModel = await getModelFromReanalysis(
          currentModel,
          collections,
          model.relationships
        );
        expect(newModel.relationships).to.deep.equal(model.relationships);
        expect(newModel.collections).to.have.lengthOf(4);

        const updateCollectionFields = Object.keys(
          newModel.collections.find((c) => c.ns === model.collections[0].ns)
            ?.jsonSchema?.properties || {}
        );
        expect(updateCollectionFields).to.deep.equal(newFields);
      });
    });
  });
});
