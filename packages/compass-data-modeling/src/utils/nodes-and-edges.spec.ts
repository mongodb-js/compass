import { expect } from 'chai';
import {
  getExtendedFields,
  relationshipToDiagramEdge,
} from './nodes-and-edges';
import { type Relationship } from '../services/data-model-storage';

describe('getExtendedFields', function () {
  describe('flat schema', function () {
    it('return empty array for empty schema', function () {
      const result = getExtendedFields({ fieldData: {} });
      expect(result).to.deep.equal([]);
    });

    it('returns fields for a simple schema, with non editable _id', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
        },
      ]);
    });

    it('returns mixed fields', function () {
      const result = getExtendedFields({
        fieldData: {
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
        expanded: true,
      });
    });

    it('highlights the correct field', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
        },
      ]);
    });

    it('highlights multiple fields', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
        },
      ]);
    });
  });

  describe('nested schema', function () {
    it('returns fields for a nested schema', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
        },
      ]);
    });

    it('highlights a field for a nested schema', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
        },
      ]);
    });

    it('ensures visibility for a highlighted field', function () {
      const result = getExtendedFields({
        fieldData: {
          bsonType: 'object',
          properties: {
            person: {
              bsonType: 'object',
              expanded: false,
              properties: {
                name: { bsonType: 'string', expanded: false },
                address: {
                  bsonType: 'object',
                  expanded: false,
                  properties: {
                    street: { bsonType: 'string', expanded: false },
                    city: { bsonType: 'string', expanded: false },
                  },
                },
              },
            },
          },
        },
        highlightedFields: [['person', 'name']],
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
          expanded: true, // this one is expanded to show the highlighted field
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
          variant: 'preview',
          editable: true,
          expanded: false,
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
          expanded: false,
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
          expanded: false,
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
          expanded: false,
        },
      ]);
    });

    it('ensures visibility for a selected field', function () {
      const result = getExtendedFields({
        fieldData: {
          bsonType: 'object',
          properties: {
            person: {
              bsonType: 'object',
              expanded: false,
              properties: {
                name: { bsonType: 'string', expanded: false },
                address: {
                  bsonType: 'object',
                  expanded: false,
                  properties: {
                    street: { bsonType: 'string', expanded: false },
                    city: { bsonType: 'string', expanded: false },
                  },
                },
              },
            },
          },
        },
        selectedField: ['person', 'address', 'street'],
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
          expanded: true, // this is expanded to show the selected field
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
          expanded: false,
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
          expanded: true, // this is expanded to show the selected field
        },
        {
          name: 'street',
          id: ['person', 'address', 'street'],
          path: ['person', 'address', 'street'],
          type: 'string',
          depth: 2,
          glyphs: [],
          selectable: true,
          selected: true,
          variant: undefined,
          editable: true,
          expanded: false,
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
          expanded: false,
        },
      ]);
    });

    it('highlights multiple fields for a nested schema', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
        },
      ]);
    });

    it('returns fields for an array of objects', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
        },
      ]);
    });

    it('returns fields for a mixed schema with objects', function () {
      const result = getExtendedFields({
        fieldData: {
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
        expanded: true,
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
        expanded: true,
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
        expanded: true,
      });
    });

    it('returns fields for an array of mixed (including objects)', function () {
      const result = getExtendedFields({
        fieldData: {
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
          expanded: true,
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
          expanded: true,
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
          expanded: true,
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

  it('should forward basic properties', function () {
    const isSelected = true;
    const edge = relationshipToDiagramEdge(relationship, isSelected);
    expect(edge.id).to.equal(relationship.id);
    expect(edge.source).to.equal(relationship.relationship[0].ns);
    expect(edge.target).to.equal(relationship.relationship[1].ns);
    expect(edge.selected).to.equal(isSelected);
  });

  it('should map cardinality to markers', function () {
    const edge = relationshipToDiagramEdge(relationship, false);
    expect(edge.markerStart).to.equal('one');
    expect(edge.markerEnd).to.equal('many');
  });

  it('should map field ids', function () {
    const edge = relationshipToDiagramEdge(relationship, false);
    expect(edge.sourceFieldId).to.equal(relationship.relationship[0].fields);
    expect(edge.targetFieldId).to.equal(relationship.relationship[1].fields);
  });

  it('should choose animated for incomplete relationships', function () {
    const incompleteEdge = relationshipToDiagramEdge(
      {
        ...relationship,
        relationship: [
          {
            ...relationship.relationship[0],
            fields: null,
          },
          relationship.relationship[1],
        ],
      },
      false
    );
    expect(incompleteEdge.animated).to.equal(true);

    const completeEdge = relationshipToDiagramEdge(relationship, false);
    expect(completeEdge.animated).to.equal(false);
  });
});
