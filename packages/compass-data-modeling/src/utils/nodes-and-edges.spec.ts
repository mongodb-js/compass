import { expect } from 'chai';
import {
  getExtendedFieldsFromSchema,
  relationshipToDiagramEdge,
} from './nodes-and-edges';
import { type Relationship } from '../services/data-model-storage';
import { type NodeProps } from '@mongodb-js/compass-components';

describe('getFieldsFromSchema', function () {
  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getExtendedFieldsFromSchema({ jsonSchema: {} });
      expect(result).to.deep.equal([]);
    });

    it('returns fields for a simple schema, with non editable _id', function () {
      const result = getExtendedFieldsFromSchema({
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
          path: ['_id'],
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
          path: ['name'],
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
          path: ['age'],
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
      const result = getExtendedFieldsFromSchema({
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
        path: ['age'],
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
      const result = getExtendedFieldsFromSchema({
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
          path: ['name'],
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
          path: ['age'],
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
          path: ['profession'],
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
      const result = getExtendedFieldsFromSchema({
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
          path: ['name'],
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
          path: ['age'],
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
          path: ['profession'],
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
      const result = getExtendedFieldsFromSchema({
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
          path: ['person'],
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
          path: ['person', 'name'],
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
          path: ['person', 'address'],
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
          path: ['person', 'address', 'street'],
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
          path: ['person', 'address', 'city'],
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
      const result = getExtendedFieldsFromSchema({
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
          path: ['person'],
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
          path: ['person', 'name'],
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
          path: ['person', 'address'],
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
          path: ['person', 'address', 'street'],
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
          path: ['person', 'address', 'city'],
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
      const result = getExtendedFieldsFromSchema({
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
          path: ['person'],
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
          path: ['person', 'name'],
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
          path: ['person', 'address'],
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
          path: ['person', 'address', 'street'],
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
          path: ['person', 'address', 'city'],
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
          path: ['person', 'billingAddress'],
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
          path: ['person', 'billingAddress', 'street'],
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
          path: ['person', 'billingAddress', 'city'],
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
      const result = getExtendedFieldsFromSchema({
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
          path: ['todos'],
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
          path: ['todos', 'title'],
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
          path: ['todos', 'completed'],
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
      const result = getExtendedFieldsFromSchema({
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
        path: ['name'],
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
        path: ['name', 'first'],
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
        path: ['name', 'last'],
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
      const result = getExtendedFieldsFromSchema({
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
          path: ['todos'],
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
          path: ['todos', 'title'],
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
          path: ['todos', 'completed'],
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

describe('relationshipToDiagramEdge', function () {
  const sourceFieldName = 'fieldA';
  const targetFieldName = 'fieldB';
  const relationship: Relationship = {
    id: 'relationship1',
    relationship: [
      {
        ns: 'db.collectionA',
        cardinality: 1,
        fields: ['parent', sourceFieldName],
      },
      {
        ns: 'db.collectionB',
        cardinality: 100,
        fields: ['otherParent', targetFieldName],
      },
    ],
    isInferred: false,
    note: 'Test relationship',
  };

  const node: NodeProps = {
    id: relationship.relationship[0].ns!,
    title: 'Collection A',
    type: 'collection',
    position: { x: 0, y: 0 },
    fields: [],
  };

  it('should forward basic properties', function () {
    const isSelected = true;
    const edge = relationshipToDiagramEdge(relationship, isSelected, []);
    expect(edge.id).to.equal(relationship.id);
    expect(edge.source).to.equal(relationship.relationship[0].ns);
    expect(edge.target).to.equal(relationship.relationship[1].ns);
    expect(edge.selected).to.equal(isSelected);
  });

  it('should map cardinality to markers', function () {
    const edge = relationshipToDiagramEdge(relationship, false, []);
    expect(edge.markerStart).to.equal('one');
    expect(edge.markerEnd).to.equal('many');
  });

  it('should find field indices', function () {
    const nodes: NodeProps[] = [
      {
        ...node,
        id: relationship.relationship[0].ns!,
        fields: [
          {
            id: ['otherPath'],
            name: 'fieldA', // same name but different path
            type: 'string',
          },
          {
            id: ['parent', 'otherField'], // same parent but different field
            name: 'otherField',
            type: 'string',
          },
          {
            id: relationship.relationship[0].fields as string[],
            name: 'fieldA',
            type: 'string',
          },
        ],
      },
      {
        ...node,
        id: relationship.relationship[1].ns!,
        fields: [
          {
            id: ['otherPath'],
            name: 'fieldB', // same name but different path
            type: 'string',
          },
          {
            id: relationship.relationship[1].fields as string[],
            name: 'fieldB',
            type: 'string',
          },
          {
            id: ['otherParent', 'otherField'], // same parent but different field
            name: 'otherField',
            type: 'string',
          },
        ],
      },
    ];

    const edge = relationshipToDiagramEdge(relationship, false, nodes);
    expect(edge.sourceFieldIndex).to.equal(2);
    expect(edge.targetFieldIndex).to.equal(1);
  });
});
