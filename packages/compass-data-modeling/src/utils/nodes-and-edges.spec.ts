import { expect } from 'chai';
import { getFieldsFromSchema } from './nodes-and-edges';

describe('getFieldsFromSchema', function () {
  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getFieldsFromSchema({ jsonSchema: {} });
      expect(result).to.deep.equal([]);
    });

    it('returns fields for a simple schema', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: 'int' },
          },
        },
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
        },
      ]);
    });
  });
});
