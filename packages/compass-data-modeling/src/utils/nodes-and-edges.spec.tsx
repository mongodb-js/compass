import React from 'react';
import { expect } from 'chai';
import {
  screen,
  waitFor,
  render,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { getFieldsFromSchema } from '../utils/nodes-and-edges';

describe('getFieldsFromSchema', function () {
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

  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getFieldsFromSchema({});
      expect(result).to.deep.equal([]);
    });

    it('returns fields for a simple schema', function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          name: { bsonType: 'string' },
          age: { bsonType: 'int' },
        },
      });
      expect(result).to.deep.equal([
        {
          name: 'name',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        { name: 'age', type: 'int', depth: 0, glyphs: [], variant: undefined },
      ]);
    });

    it('returns mixed fields with tooltip on hover', async function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          age: { bsonType: ['int', 'string'] },
        },
      });
      expect(result[0]).to.deep.include({
        name: 'age',
        depth: 0,
        glyphs: [],
        variant: undefined,
      });
      await validateMixedType(result[0].type, /int, string/);
    });

    it('highlights the correct field', function () {
      const result = getFieldsFromSchema(
        {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: 'int' },
            profession: { bsonType: 'string' },
          },
        },
        [['age']]
      );
      expect(result).to.deep.equal([
        {
          name: 'name',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        { name: 'age', type: 'int', depth: 0, glyphs: [], variant: 'preview' },
        {
          name: 'profession',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });

    it('highlights multiple fields', function () {
      const result = getFieldsFromSchema(
        {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: 'int' },
            profession: { bsonType: 'string' },
          },
        },
        [['age'], ['profession']]
      );
      expect(result).to.deep.equal([
        {
          name: 'name',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        { name: 'age', type: 'int', depth: 0, glyphs: [], variant: 'preview' },
        {
          name: 'profession',
          type: 'string',
          depth: 0,
          glyphs: [],
          variant: 'preview',
        },
      ]);
    });
  });

  describe('nested schema', function () {
    it('returns fields for a nested schema', function () {
      const result = getFieldsFromSchema({
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
      });
      expect(result).to.deep.equal([
        {
          name: 'person',
          type: 'object',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'name',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'address',
          type: 'object',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'street',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'city',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });

    it('highlights a field for a nested schema', function () {
      const result = getFieldsFromSchema(
        {
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
        [['person', 'address', 'street']]
      );
      expect(result).to.deep.equal([
        {
          name: 'person',
          type: 'object',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'name',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'address',
          type: 'object',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'street',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: 'preview',
        },
        {
          name: 'city',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });

    it('highlights multiple fields for a nested schema', function () {
      const result = getFieldsFromSchema(
        {
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
        [
          ['person', 'address', 'street'],
          ['person', 'billingAddress', 'city'],
        ]
      );
      expect(result).to.deep.equal([
        {
          name: 'person',
          type: 'object',
          depth: 0,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'name',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'address',
          type: 'object',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'street',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: 'preview',
        },
        {
          name: 'city',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'billingAddress',
          type: 'object',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'street',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'city',
          type: 'string',
          depth: 2,
          glyphs: [],
          variant: 'preview',
        },
      ]);
    });

    it('returns [] for array', function () {
      const result = getFieldsFromSchema({
        bsonType: 'object',
        properties: {
          tags: {
            bsonType: 'array',
            items: { bsonType: 'string' },
          },
        },
      });
      expect(result).to.deep.equal([
        { name: 'tags', type: '[]', depth: 0, glyphs: [], variant: undefined },
      ]);
    });

    it('returns fields for an array of objects', function () {
      const result = getFieldsFromSchema({
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
      });
      expect(result).to.deep.equal([
        { name: 'todos', type: '[]', depth: 0, glyphs: [], variant: undefined },
        {
          name: 'title',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'completed',
          type: 'boolean',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });

    it('returns fields for a mixed schema with objects', async function () {
      const result = getFieldsFromSchema({
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
      });
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.include({
        name: 'name',
        depth: 0,
        glyphs: [],
        variant: undefined,
      });
      await validateMixedType(result[0].type, /string, object/);
      expect(result[1]).to.deep.equal({
        name: 'first',
        type: 'string',
        depth: 1,
        glyphs: [],
        variant: undefined,
      });
      expect(result[2]).to.deep.equal({
        name: 'last',
        type: 'string',
        depth: 1,
        glyphs: [],
        variant: undefined,
      });
    });

    it('returns fields for an array of mixed (including objects)', function () {
      const result = getFieldsFromSchema({
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
      });
      expect(result).to.deep.equal([
        { name: 'todos', type: '[]', depth: 0, glyphs: [], variant: undefined },
        {
          name: 'title',
          type: 'string',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
        {
          name: 'completed',
          type: 'boolean',
          depth: 1,
          glyphs: [],
          variant: undefined,
        },
      ]);
    });
  });
});
