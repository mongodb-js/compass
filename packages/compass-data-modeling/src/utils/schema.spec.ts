import { expect } from 'chai';
import { addFieldToJSONSchema, getNewUnusedFieldName } from './schema';

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
  });

  describe('#addFieldToJSONSchema', function () {
    it('should add a field to the root of the schema', function () {
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
      const newFieldSchema = {
        bsonType: 'string',
      };
      const newJsonSchema = addFieldToJSONSchema(
        jsonSchema,
        ['c'],
        newFieldSchema
      );
      expect(newJsonSchema).to.deep.equal({
        bsonType: 'object',
        properties: {
          a: {
            bsonType: 'string',
          },
          b: {
            bsonType: 'string',
          },
          c: {
            bsonType: 'string',
          },
        },
      });
    });

    it('should add a field to a nested object in the schema', function () {
      const jsonSchema = {
        bsonType: 'object',
        properties: {
          a: {
            bsonType: 'string',
          },
          b: {
            bsonType: 'object',
            properties: {
              c: {
                bsonType: 'string',
              },
            },
          },
        },
      };
      const newFieldSchema = {
        bsonType: 'string',
      };
      const newJsonSchema = addFieldToJSONSchema(
        jsonSchema,
        ['b', 'd'],
        newFieldSchema
      );
      expect(newJsonSchema).to.deep.equal({
        bsonType: 'object',
        properties: {
          a: {
            bsonType: 'string',
          },
          b: {
            bsonType: 'object',
            properties: {
              c: {
                bsonType: 'string',
              },
              d: {
                bsonType: 'string',
              },
            },
          },
        },
      });
    });
  });
});
