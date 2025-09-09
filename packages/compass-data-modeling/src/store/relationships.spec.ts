import { expect } from 'chai';
import Sinon from 'sinon';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { Document } from 'bson';
import {
  findPropertyPathsMatchingSchema,
  getValuesFromPath,
  inferForeignToLocalRelationshipsForCollection,
  traverseMongoDBJSONSchema,
} from './relationships';

describe('relationships', function () {
  describe('traverseMongoDBJSONSchema', function () {
    it('should traverse the full schema, calling visitor function for every encountered type variant including root', function () {
      const visitedTypes = new Map<string, string[]>();
      traverseMongoDBJSONSchema(
        {
          anyOf: [
            { bsonType: 'int' },
            {
              bsonType: 'object',
              properties: {
                foo: {
                  bsonType: 'array',
                  items: [
                    { bsonType: 'string' },
                    {
                      bsonType: 'object',
                      properties: { bar: { bsonType: 'int' } },
                    },
                  ],
                },
                buz: { bsonType: ['int', 'bool'] },
              },
            },
          ],
        },
        (schema, path) => {
          const pathStr = path.join('.');
          const pathTypes =
            visitedTypes.get(pathStr) ??
            visitedTypes.set(pathStr, []).get(pathStr);
          pathTypes?.push(schema.bsonType as string);
        }
      );
      expect(Array.from(visitedTypes.entries())).to.deep.eq([
        ['', ['int', 'object']],
        ['foo', ['array', 'string', 'object']],
        ['foo.bar', ['int']],
        ['buz', ['int', 'bool']],
      ]);
    });
  });

  describe('findPropertyPathsMatchingSchema', function () {
    it('should return paths for documents matching provided schema', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          foo: { bsonType: 'date' },
          bar: { bsonType: ['string', 'int'] },
          buz: { anyOf: [{ bsonType: 'decimal' }, { bsonType: 'bool' }] },
          bla: {
            bsonType: 'object',
            properties: { abc: { bsonType: 'string' } },
          },
        },
      };
      expect(
        findPropertyPathsMatchingSchema(schema, { bsonType: 'date' })
      ).to.deep.eq([['foo']]);
      expect(
        findPropertyPathsMatchingSchema(schema, { bsonType: 'string' })
      ).to.deep.eq([['bar'], ['bla', 'abc']]);
      expect(
        findPropertyPathsMatchingSchema(schema, { bsonType: 'bool' })
      ).to.deep.eq([['buz']]);
      expect(
        findPropertyPathsMatchingSchema(schema, {
          bsonType: 'object',
          properties: { abc: { bsonType: 'string' } },
        })
      ).to.deep.eq([['bla']]);
    });
  });

  describe('getValuesFromPath', function () {
    it('should return values from the document', function () {
      const doc = {
        foo: { bar: { buz: [{ bla: 1 }, { bla: 2 }, { bla: 3 }] } },
        abc: 1,
        def: [1, 2, 3],
      };
      expect(getValuesFromPath(doc, ['abc'])).to.deep.eq([1]);
      expect(getValuesFromPath(doc, ['def'])).to.deep.eq([1, 2, 3]);
      expect(getValuesFromPath(doc, ['foo', 'bar', 'buz', 'bla'])).to.deep.eq([
        1, 2, 3,
      ]);
      expect(getValuesFromPath(doc, ['does', 'not', 'exist'])).to.deep.eq([]);
    });
  });

  describe('inferForeignToLocalRelationshipsForCollection', function () {
    it('should return identified relationships for a collection', async function () {
      const collections: {
        ns: string;
        schema: MongoDBJSONSchema;
        sample: Document[];
      }[] = [
        {
          ns: 'db.coll1',
          schema: {
            bsonType: 'object',
            properties: { _id: { bsonType: 'string' } },
          },
          sample: [{ _id: 'abc' }],
        },
        {
          ns: 'db.coll2',
          schema: {
            bsonType: 'object',
            properties: {
              _id: { bsonType: 'string' },
              coll1_id: { bsonType: 'string' },
            },
          },
          sample: [{ coll1_id: 'abc' }],
        },
      ];
      const mockDataService = Sinon.spy({
        indexes() {
          return Promise.resolve([
            { name: '_id_', fields: [{ field: '_id' }] },
          ]);
        },
        count(ns) {
          if (ns === 'db.coll1') {
            return Promise.resolve(1);
          }
          return Promise.resolve(0);
        },
      });
      const relationships = await inferForeignToLocalRelationshipsForCollection(
        collections[0].ns,
        collections[0].schema,
        collections[0].sample,
        collections,
        mockDataService as any
      );
      expect(relationships).to.deep.eq([
        [
          {
            cardinality: 1,
            fields: ['coll1_id'],
            ns: 'db.coll2',
          },
          {
            cardinality: 1,
            fields: ['_id'],
            ns: 'db.coll1',
          },
        ],
      ]);
    });
  });
});
