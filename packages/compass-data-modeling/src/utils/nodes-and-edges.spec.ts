import { expect } from 'chai';
import { getFieldsFromSchema } from './nodes-and-edges';

describe('getFieldsFromSchema', function () {
  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getFieldsFromSchema({ jsonSchema: {} });
      expect(result).to.deep.equal([]);
    });

    it('returns fields for a simple schema, with non editable _id', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
          bsonType: 'object',
          properties: {
            _id: { bsonType: 'objectId' },
            name: { bsonType: 'string' },
            age: { bsonType: 'int' },
          },
        },
      });
      expect(result).to.deep.equal([
        {
          name: '_id',
          id: ['_id'],
          type: 'objectId',
          depth: 0,
          glyphs: ['key'],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: false,
        },
        {
          name: 'name',
          id: ['name'],
          type: 'string',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'age',
          id: ['age'],
          type: 'int',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
      ]);
    });

    it('returns mixed fields', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
          bsonType: 'object',
          properties: {
            age: { bsonType: ['int', 'string'] },
          },
        },
      });
      expect(result[0]).to.deep.equal({
        name: 'age',
        id: ['age'],
        depth: 0,
        glyphs: [],
        selectable: true,
        selected: false,
        type: ['int', 'string'],
        variant: undefined,
        editable: true,
      });
    });

    it('highlights the correct field', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: 'int' },
            profession: { bsonType: 'string' },
          },
        },
        highlightedFields: [['age']],
      });
      expect(result).to.deep.equal([
        {
          name: 'name',
          id: ['name'],
          type: 'string',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'age',
          id: ['age'],
          type: 'int',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: 'preview',
          editable: true,
        },
        {
          name: 'profession',
          id: ['profession'],
          type: 'string',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
      ]);
    });

    it('highlights multiple fields', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: 'int' },
            profession: { bsonType: 'string' },
          },
        },
        highlightedFields: [['age'], ['profession']],
      });
      expect(result).to.deep.equal([
        {
          name: 'name',
          id: ['name'],
          type: 'string',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'age',
          id: ['age'],
          type: 'int',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: 'preview',
          editable: true,
        },
        {
          name: 'profession',
          id: ['profession'],
          type: 'string',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: 'preview',
          editable: true,
        },
      ]);
    });
  });

  describe('nested schema', function () {
    it('returns fields for a nested schema', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
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
      });
      expect(result).to.deep.equal([
        {
          name: 'person',
          id: ['person'],
          type: 'object',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'name',
          id: ['person', 'name'],
          type: 'string',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'address',
          id: ['person', 'address'],
          type: 'object',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'street',
          id: ['person', 'address', 'street'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'city',
          id: ['person', 'address', 'city'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
      ]);
    });

    it('highlights a field for a nested schema', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
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
        highlightedFields: [['person', 'address', 'street']],
      });
      expect(result).to.deep.equal([
        {
          name: 'person',
          id: ['person'],
          type: 'object',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'name',
          id: ['person', 'name'],
          type: 'string',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'address',
          id: ['person', 'address'],
          type: 'object',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'street',
          id: ['person', 'address', 'street'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: 'preview',
          editable: true,
        },
        {
          name: 'city',
          id: ['person', 'address', 'city'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
      ]);
    });

    it('highlights multiple fields for a nested schema', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
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
                billingAddress: {
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
        highlightedFields: [
          ['person', 'address', 'street'],
          ['person', 'billingAddress', 'city'],
        ],
      });
      expect(result).to.deep.equal([
        {
          name: 'person',
          id: ['person'],
          type: 'object',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'name',
          id: ['person', 'name'],
          type: 'string',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'address',
          id: ['person', 'address'],
          type: 'object',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'street',
          id: ['person', 'address', 'street'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: 'preview',
          editable: true,
        },
        {
          name: 'city',
          id: ['person', 'address', 'city'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'billingAddress',
          id: ['person', 'billingAddress'],
          type: 'object',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'street',
          id: ['person', 'billingAddress', 'street'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'city',
          id: ['person', 'billingAddress', 'city'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: 'preview',
          editable: true,
        },
      ]);
    });

    it('returns fields for an array of objects', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
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
        },
      });
      expect(result).to.deep.equal([
        {
          name: 'todos',
          id: ['todos'],
          type: 'array',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'title',
          id: ['todos', 'title'],
          type: 'string',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'completed',
          id: ['todos', 'completed'],
          type: 'boolean',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
      ]);
    });

    it('returns fields for a mixed schema with objects', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
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
        },
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.equal({
        name: 'name',
        id: ['name'],
        depth: 0,
        type: ['string', 'object'],
        glyphs: [],
        selectable: true,
        selected: false,
        variant: undefined,
        editable: true,
      });
      expect(result[1]).to.deep.equal({
        name: 'first',
        id: ['name', 'first'],
        type: 'string',
        depth: 1,
        glyphs: [],
        selectable: true,
        selected: false,
        variant: undefined,
        editable: true,
      });
      expect(result[2]).to.deep.equal({
        name: 'last',
        id: ['name', 'last'],
        type: 'string',
        depth: 1,
        glyphs: [],
        selectable: true,
        selected: false,
        variant: undefined,
        editable: true,
      });
    });

    it('returns fields for an array of mixed (including objects)', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
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
        },
      });
      expect(result).to.deep.equal([
        {
          name: 'todos',
          id: ['todos'],
          type: 'array',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'title',
          id: ['todos', 'title'],
          type: 'string',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
        {
          name: 'completed',
          id: ['todos', 'completed'],
          type: 'boolean',
          depth: 1,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
          editable: true,
        },
      ]);
    });
  });
});
