import React from 'react';
import { expect } from 'chai';
import {
  screen,
  waitFor,
  render,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import type { NodeProps } from '@mongodb-js/diagramming';

import {
  getFieldsFromSchema,
  getBaseFieldsFromSchema,
} from './nodes-and-edges';

const validateMixedType = async (
  type: React.ReactNode,
  expectedTooltip: RegExp
) => {
  render(<>{type}</>);
  const mixed = screen.getByText('(mixed)');
  expect(mixed).to.be.visible;
  expect(screen.queryByText(expectedTooltip)).to.not.exist;
  userEvent.hover(mixed);
  await waitFor(() => {
    expect(screen.getByText(expectedTooltip)).to.be.visible;
  });
};

function withoutObjectReactType(fields: NodeProps['fields']) {
  return fields.map((f) => ({
    ...f,
    type:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof f.type === 'object' &&
      (f?.type as any)?.$$typeof === Symbol.for('react.element')
        ? 'object'
        : f.type,
  }));
}

describe('getBaseFieldsFromSchema', function () {
  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getBaseFieldsFromSchema({ jsonSchema: {} });
      expect(result).to.deep.equal([]);
    });

    it('returns fields for a simple schema', function () {
      const result = getBaseFieldsFromSchema({
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
          depth: 0,
        },
        {
          name: 'age',
          id: ['age'],
          depth: 0,
        },
      ]);
    });

    it('returns fields for an array of mixed (including objects)', function () {
      const result = getBaseFieldsFromSchema({
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
          depth: 0,
        },
        {
          name: 'title',
          id: ['todos', 'title'],
          depth: 1,
        },
        {
          name: 'completed',
          id: ['todos', 'completed'],
          depth: 1,
        },
      ]);
    });
  });
});

describe('getFieldsFromSchema', function () {
  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {},
        onClickAddNestedField: () => {},
      });
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
        onClickAddNestedField: () => {},
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

    it('returns mixed fields with tooltip on hover', async function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
          bsonType: 'object',
          properties: {
            age: { bsonType: ['int', 'string'] },
          },
        },
        onClickAddNestedField: () => {},
      });
      expect(result[0]).to.deep.include({
        name: 'age',
        id: ['age'],
        depth: 0,
        glyphs: [],
        selectable: true,
        selected: false,
        variant: undefined,
      });
      await validateMixedType(result[0].type, /int, string/);
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
        onClickAddNestedField: () => {},
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
        onClickAddNestedField: () => {},
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
        onClickAddNestedField: () => {},
      });
      expect(withoutObjectReactType(result)).to.deep.equal([
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
        onClickAddNestedField: () => {},
      });
      expect(withoutObjectReactType(result)).to.deep.equal([
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
        onClickAddNestedField: () => {},
      });
      expect(withoutObjectReactType(result)).to.deep.equal([
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

    it('returns [] for array', function () {
      const result = getFieldsFromSchema({
        jsonSchema: {
          bsonType: 'object',
          properties: {
            tags: {
              bsonType: 'array',
              items: { bsonType: 'string' },
            },
          },
        },
        onClickAddNestedField: () => {},
      });
      expect(result).to.deep.equal([
        {
          name: 'tags',
          id: ['tags'],
          type: '[]',
          depth: 0,
          glyphs: [],
          selectable: true,
          selected: false,
          variant: undefined,
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
        onClickAddNestedField: () => {},
      });
      expect(result).to.deep.equal([
        {
          name: 'todos',
          id: ['todos'],
          type: '[]',
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

    it('returns fields for a mixed schema with objects', async function () {
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
        onClickAddNestedField: () => {},
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.include({
        name: 'name',
        id: ['name'],
        depth: 0,
        glyphs: [],
        selectable: true,
        selected: false,
        variant: undefined,
      });
      await validateMixedType(result[0].type, /string, object/);
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
        onClickAddNestedField: () => {},
      });
      expect(result).to.deep.equal([
        {
          name: 'todos',
          id: ['todos'],
          type: '[]',
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
