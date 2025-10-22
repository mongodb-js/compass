import { expect } from 'chai';
import { getNewUnusedFieldName } from './schema';
import type { MongoDBJSONSchema } from 'mongodb-schema';

describe('schema diagram utils', function () {
  describe('#getNewUnusedFieldName', function () {
    it('should return a new unused field name', function () {
      const jsonSchema = {
        bsonType: 'object',
        properties: {
          a: {
            bsonType: 'string',
          },
          b: {
            bsonType: 'string',
          },
        },
      };
      const newFieldName = getNewUnusedFieldName(jsonSchema);
      expect(newFieldName).to.equal('field-1');
    });

    it('should return a new unused field name when there are conflicts', function () {
      const jsonSchema = {
        bsonType: 'object',
        properties: {
          'field-1': {
            bsonType: 'string',
          },
          'field-2': {
            bsonType: 'string',
          },
        },
      };
      const newFieldName = getNewUnusedFieldName(jsonSchema);
      expect(newFieldName).to.equal('field-3');
    });

    it('should return a new unused field name for a nested field', function () {
      const jsonSchema = {
        bsonType: 'object',
        properties: {
          a: {
            bsonType: 'object',
            properties: {
              'field-1': {
                bsonType: 'string',
              },
            },
          },
          b: {
            bsonType: 'object',
            properties: {
              'field-1': {
                bsonType: 'string',
              },
              'field-2': {
                bsonType: 'string',
              },
            },
          },
        },
      };
      const newFieldName = getNewUnusedFieldName(jsonSchema, ['b']);
      expect(newFieldName).to.equal('field-3');
    });

    it('should return a new unused field name for a mixed field', function () {
      const jsonSchema = {
        bsonType: 'object',
        properties: {
          a: {
            anyOf: [
              {
                bsonType: 'string',
              },
              {
                bsonType: 'object',
                properties: {
                  'field-1': {
                    bsonType: 'string',
                  },
                },
              },
              {
                bsonType: 'object',
                properties: {
                  'field-2': {
                    bsonType: 'string',
                  },
                },
              },
            ] as MongoDBJSONSchema[],
          },
        },
      };
      const newFieldName = getNewUnusedFieldName(jsonSchema, ['a']);
      expect(newFieldName).to.equal('field-3');
    });

    it('should return a new unused field name for an array of objects', function () {
      const jsonSchema = {
        bsonType: 'object',
        properties: {
          a: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              properties: {
                'field-1': {
                  bsonType: 'string',
                },
              },
            },
          },
        },
      };
      const newFieldName = getNewUnusedFieldName(jsonSchema, ['a']);
      expect(newFieldName).to.equal('field-2');
    });
  });
});
