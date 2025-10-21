import { expect } from 'chai';
import {
  traverseSchema,
  getFieldFromSchema,
  updateSchema,
  getSchemaWithNewTypes,
} from './schema-traversal';
import Sinon from 'sinon';
import type { FieldPath } from '../services/data-model-storage';

describe('traverseSchema', function () {
  let sandbox: Sinon.SinonSandbox;
  let visitor: Sinon.SinonSpy;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    visitor = sandbox.spy();
  });

  afterEach(function () {
    sandbox.restore();
    sandbox.resetHistory();
  });

  describe('flat schema', function () {
    it('empty schema', function () {
      traverseSchema({
        visitor,
        jsonSchema: {},
      });
      expect(visitor).not.to.have.been.called;
    });

    it('simple schema', function () {
      traverseSchema({
        visitor,
        jsonSchema: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: ['string', 'int'] },
          },
        },
      });
      expect(visitor.callCount).to.equal(2);
      expect(visitor.getCall(0).args[0]).to.deep.equal({
        fieldPath: ['name'],
        fieldTypes: ['string'],
        fieldSchema: { bsonType: 'string' },
      });
      expect(visitor.getCall(1).args[0]).to.deep.equal({
        fieldPath: ['age'],
        fieldTypes: ['string', 'int'],
        fieldSchema: { bsonType: ['string', 'int'] },
      });
    });
  });

  describe('nested schema', function () {
    it('nested objects', function () {
      traverseSchema({
        visitor,
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
      expect(visitor.callCount).to.equal(5);
      expect(visitor.getCall(0).args[0]).to.deep.include({
        fieldPath: ['person'],
        fieldTypes: ['object'],
      });
      expect(visitor.getCall(1).args[0]).to.deep.include({
        fieldPath: ['person', 'name'],
        fieldTypes: ['string'],
      });
      expect(visitor.getCall(2).args[0]).to.deep.include({
        fieldPath: ['person', 'address'],
        fieldTypes: ['object'],
      });
      expect(visitor.getCall(3).args[0]).to.deep.include({
        fieldPath: ['person', 'address', 'street'],
        fieldTypes: ['string'],
      });
      expect(visitor.getCall(4).args[0]).to.deep.include({
        fieldPath: ['person', 'address', 'city'],
        fieldTypes: ['string'],
      });
    });

    it('a mixed type with objects', function () {
      traverseSchema({
        visitor,
        jsonSchema: {
          bsonType: 'object',
          properties: {
            names: {
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
      expect(visitor.callCount).to.equal(3);
      expect(visitor.getCall(0).args[0]).to.deep.include({
        fieldPath: ['names'],
        fieldTypes: ['string', 'object'],
      });
      expect(visitor.getCall(1).args[0]).to.deep.include({
        fieldPath: ['names', 'first'],
        fieldTypes: ['string'],
      });
      expect(visitor.getCall(2).args[0]).to.deep.include({
        fieldPath: ['names', 'last'],
        fieldTypes: ['string'],
      });
    });

    it('array of objects', function () {
      traverseSchema({
        visitor,
        jsonSchema: {
          bsonType: 'object',
          properties: {
            addresses: {
              bsonType: 'array',
              items: {
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
      expect(visitor.callCount).to.equal(3);
      expect(visitor.getCall(0).args[0]).to.deep.include({
        fieldPath: ['addresses'],
        fieldTypes: ['array'],
      });
      expect(visitor.getCall(1).args[0]).to.deep.include({
        fieldPath: ['addresses', 'street'],
        fieldTypes: ['string'],
      });
      expect(visitor.getCall(2).args[0]).to.deep.include({
        fieldPath: ['addresses', 'city'],
        fieldTypes: ['string'],
      });
    });

    it('an array of mixed items (including objects)', function () {
      traverseSchema({
        visitor,
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
                      completed: { bsonType: 'bool' },
                    },
                  },
                  { bsonType: 'string' },
                ],
              },
            },
          },
        },
      });
      expect(visitor.callCount).to.equal(3);
      expect(visitor.getCall(0).args[0]).to.deep.include({
        fieldPath: ['todos'],
        fieldTypes: ['array'],
      });
      expect(visitor.getCall(1).args[0]).to.deep.include({
        fieldPath: ['todos', 'title'],
        fieldTypes: ['string'],
      });
      expect(visitor.getCall(2).args[0]).to.deep.include({
        fieldPath: ['todos', 'completed'],
        fieldTypes: ['bool'],
      });
    });
  });
});

describe('getFieldFromSchema', function () {
  describe('field not found', function () {
    it('empty schema', function () {
      const result = getFieldFromSchema({
        fieldPath: ['name'],
        jsonSchema: {},
      });
      expect(result).to.be.undefined;
    });

    it('wrong path', function () {
      const result = getFieldFromSchema({
        fieldPath: ['address', 'age'],
        jsonSchema: {
          bsonType: 'object',
          properties: {
            person: {
              bsonType: 'object',
              properties: {
                age: { bsonType: 'int' },
                name: { bsonType: 'string' },
              },
            },
            address: {
              bsonType: 'object',
              properties: {
                street: { bsonType: 'string' },
                city: { bsonType: 'string' },
              },
            },
          },
        },
      });
      expect(result).to.be.undefined;
    });
  });

  describe('flat schema', function () {
    it('single type', function () {
      const result = getFieldFromSchema({
        fieldPath: ['name'],
        jsonSchema: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: ['string', 'int'] },
          },
        },
      });
      expect(result).to.deep.equal({
        fieldTypes: ['string'],
        jsonSchema: { bsonType: 'string' },
      });
    });
    it('simple mixed type', function () {
      const result = getFieldFromSchema({
        fieldPath: ['age'],
        jsonSchema: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            age: { bsonType: ['string', 'int'] },
          },
        },
      });
      expect(result).to.deep.equal({
        fieldTypes: ['string', 'int'],
        jsonSchema: { bsonType: ['string', 'int'] },
      });
    });
  });

  describe('nested schema', function () {
    it('nested objects - parent', function () {
      const result = getFieldFromSchema({
        fieldPath: ['person', 'address'],
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
      expect(result).to.deep.equal({
        fieldTypes: ['object'],
        jsonSchema: {
          bsonType: 'object',
          properties: {
            street: { bsonType: 'string' },
            city: { bsonType: 'string' },
          },
        },
      });
    });

    it('nested objects - leaf', function () {
      const result = getFieldFromSchema({
        fieldPath: ['person', 'address', 'city'],
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
      expect(result).to.deep.equal({
        fieldTypes: ['string'],
        jsonSchema: { bsonType: 'string' },
      });
    });

    it('nested in a mixed type', function () {
      const result = getFieldFromSchema({
        fieldPath: ['names', 'first'],
        jsonSchema: {
          bsonType: 'object',
          properties: {
            names: {
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
      expect(result).to.deep.equal({
        fieldTypes: ['string'],
        jsonSchema: { bsonType: 'string' },
      });
    });

    it('has a mixed type', function () {
      const result = getFieldFromSchema({
        fieldPath: ['names'],
        jsonSchema: {
          bsonType: 'object',
          properties: {
            names: {
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
      expect(result).to.deep.include({
        fieldTypes: ['string', 'object'],
      });
    });

    it('nested in an array of objects', function () {
      const result = getFieldFromSchema({
        fieldPath: ['addresses', 'streetNumber'],
        jsonSchema: {
          bsonType: 'object',
          properties: {
            addresses: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  street: { bsonType: 'string' },
                  streetNumber: { bsonType: ['int', 'string'] },
                  city: { bsonType: 'string' },
                },
              },
            },
          },
        },
      });
      expect(result).to.deep.equal({
        fieldTypes: ['int', 'string'],
        jsonSchema: { bsonType: ['int', 'string'] },
      });
    });

    it('nested in an array of mixed items (including objects)', function () {
      const result = getFieldFromSchema({
        fieldPath: ['todos', 'completed'],
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
                      completed: { bsonType: 'bool' },
                    },
                  },
                  { bsonType: 'string' },
                ],
              },
            },
          },
        },
      });
      expect(result).to.deep.equal({
        fieldTypes: ['bool'],
        jsonSchema: { bsonType: 'bool' },
      });
    });
  });
});

describe('removeField', function () {
  describe('field not found', function () {
    it('empty schema', function () {
      const result = updateSchema({
        fieldPath: ['name'],
        jsonSchema: {},
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal({});
    });

    it('wrong path', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          person: {
            bsonType: 'object',
            properties: {
              age: { bsonType: 'int' },
              name: { bsonType: 'string' },
            },
          },
          address: {
            bsonType: 'object',
            properties: {
              street: { bsonType: 'string' },
              city: { bsonType: 'string' },
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['address', 'age'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal(schema);
    });
  });

  describe('flat schema', function () {
    it('remove top level field', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          name: { bsonType: 'string' },
          age: { bsonType: ['string', 'int'] },
        },
      };
      const result = updateSchema({
        fieldPath: ['name'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          age: schema.properties.age,
        },
      });
    });

    it('clean up required', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          name: { bsonType: 'string' },
          age: { bsonType: ['string', 'int'] },
        },
        required: ['name', 'age'],
      };
      const result = updateSchema({
        fieldPath: ['name'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result.required).to.deep.equal(['age']);
    });
  });

  describe('nested schema', function () {
    it('remove a field from the middle level', function () {
      const schema = {
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
      };
      const result = updateSchema({
        fieldPath: ['person', 'address'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          person: {
            ...schema.properties.person,
            properties: {
              name: schema.properties.person.properties.name,
            },
          },
        },
      });
    });

    it('remove a deeply nested field', function () {
      const schema = {
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
      };
      const result = updateSchema({
        fieldPath: ['person', 'address', 'city'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          person: {
            ...schema.properties.person,
            properties: {
              name: schema.properties.person.properties.name,
              address: {
                ...schema.properties.person.properties.address,
                properties: {
                  street:
                    schema.properties.person.properties.address.properties
                      .street,
                },
              },
            },
          },
        },
      });
    });

    it('remove field nested in a mixed type', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          names: {
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
      };
      const result = updateSchema({
        fieldPath: ['names', 'first'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          names: {
            anyOf: [
              { bsonType: 'string' },
              {
                bsonType: 'object',
                properties: {
                  last: { bsonType: 'string' },
                },
              },
            ],
          },
        },
      });
    });

    it('nested in an array of objects', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          addresses: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              properties: {
                street: { bsonType: 'string' },
                streetNumber: { bsonType: ['int', 'string'] },
                city: { bsonType: 'string' },
              },
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['addresses', 'streetNumber'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          addresses: {
            ...schema.properties.addresses,
            items: {
              ...schema.properties.addresses.items,
              properties: {
                street: { bsonType: 'string' },
                city: { bsonType: 'string' },
              },
            },
          },
        },
      });
    });

    it('nested in an array of mixed items (including objects)', function () {
      const schema = {
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
                    completed: { bsonType: 'bool' },
                  },
                },
                { bsonType: 'string' },
              ],
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['todos', 'completed'],
        jsonSchema: schema,
        updateParameters: {
          update: 'removeField',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          todos: {
            bsonType: 'array',
            items: {
              anyOf: [
                {
                  bsonType: 'object',
                  properties: {
                    title: { bsonType: 'string' },
                  },
                },
                { bsonType: 'string' },
              ],
            },
          },
        },
      });
    });
  });
});

describe('addField', function () {
  describe('flat schema', function () {
    it('add top level field', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          name: { bsonType: 'string' },
        },
      };
      const result = updateSchema({
        jsonSchema: schema,
        fieldPath: [],
        updateParameters: {
          update: 'addField',
          newFieldName: 'age',
          newFieldSchema: { bsonType: ['string', 'int'] },
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          ...schema.properties,
          age: { bsonType: ['string', 'int'] },
        },
      });
    });
  });

  describe('nested schema', function () {
    it('add a field to an object [properties]', function () {
      const schema = {
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
      };
      const result = updateSchema({
        fieldPath: ['person', 'address'],
        jsonSchema: schema,
        updateParameters: {
          update: 'addField',
          newFieldName: 'country',
          newFieldSchema: { bsonType: 'string' },
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          person: {
            ...schema.properties.person,
            properties: {
              ...schema.properties.person.properties,
              address: {
                ...schema.properties.person.properties.address,
                properties: {
                  ...schema.properties.person.properties.address.properties,
                  country: { bsonType: 'string' },
                },
              },
            },
          },
        },
      });
    });

    it('add a field to a nested array [properties, items]', function () {
      const schema = {
        type: 'object',
        properties: {
          parent: {
            bsonType: 'object',
            properties: {
              arrayOfObjects: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    field1: {
                      bsonType: 'string',
                    },
                  },
                },
              },
              sibling: {
                bsonType: 'object',
                properties: {
                  fieldA: {
                    bsonType: 'int',
                  },
                },
              },
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['parent', 'arrayOfObjects'],
        jsonSchema: schema,
        updateParameters: {
          update: 'addField',
          newFieldName: 'field2',
          newFieldSchema: { bsonType: 'string' },
        },
      });
      const newFields: FieldPath[] = [];
      traverseSchema({
        jsonSchema: result,
        visitor: ({ fieldPath }) => {
          newFields.push(fieldPath);
        },
      });
      expect(newFields).to.deep.equal([
        ['parent'],
        ['parent', 'arrayOfObjects'],
        ['parent', 'arrayOfObjects', 'field1'],
        ['parent', 'arrayOfObjects', 'field2'],
        ['parent', 'sibling'],
        ['parent', 'sibling', 'fieldA'],
      ]);
    });

    it('add a field to an array of objects [items, properties]', function () {
      const schema = {
        type: 'object',
        properties: {
          arrayOfObjects: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              properties: {
                field1: {
                  bsonType: 'string',
                },
              },
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['arrayOfObjects'],
        jsonSchema: schema,
        updateParameters: {
          update: 'addField',
          newFieldName: 'field2',
          newFieldSchema: { bsonType: 'string' },
        },
      });
      expect(result.properties?.arrayOfObjects).to.deep.equal({
        ...schema.properties?.arrayOfObjects,
        items: {
          ...schema.properties?.arrayOfObjects.items,
          properties: {
            ...schema.properties?.arrayOfObjects.items.properties,
            field2: { bsonType: 'string' },
          },
        },
      });
    });

    it('add a field to a mixed type with object [anyOf, properties]', function () {
      const schema = {
        type: 'object',
        properties: {
          mixedField: {
            anyOf: [
              {
                bsonType: 'object',
                properties: {
                  field1: {
                    bsonType: 'string',
                  },
                },
              },
              {
                bsonType: 'int',
              },
            ],
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['mixedField'],
        jsonSchema: schema,
        updateParameters: {
          update: 'addField',
          newFieldName: 'field2',
          newFieldSchema: { bsonType: 'string' },
        },
      });
      expect(result.properties?.mixedField).to.deep.equal({
        anyOf: [
          {
            ...schema.properties?.mixedField?.anyOf[0],
            properties: {
              ...schema.properties?.mixedField?.anyOf[0].properties,
              field2: { bsonType: 'string' },
            },
          },
          schema.properties?.mixedField?.anyOf[1],
        ],
      });
    });

    it('add a field to a mixed array with objects [items, anyOf, properties]', function () {
      const schema = {
        type: 'object',
        properties: {
          mixedArrayField: {
            bsonType: 'array',
            items: {
              anyOf: [
                {
                  bsonType: 'object',
                  properties: {
                    field1: {
                      bsonType: 'string',
                    },
                  },
                },
                {
                  bsonType: 'int',
                },
              ],
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['mixedArrayField'],
        jsonSchema: schema,
        updateParameters: {
          update: 'addField',
          newFieldName: 'field2',
          newFieldSchema: { bsonType: 'string' },
        },
      });
      expect(result.properties?.mixedArrayField).to.deep.equal({
        bsonType: 'array',
        items: {
          anyOf: [
            {
              ...schema.properties?.mixedArrayField?.items.anyOf[0],
              properties: {
                ...schema.properties?.mixedArrayField?.items.anyOf[0]
                  .properties,
                field2: { bsonType: 'string' },
              },
            },
            schema.properties?.mixedArrayField?.items.anyOf[1],
          ],
        },
      });
      const newFields: FieldPath[] = [];
      traverseSchema({
        jsonSchema: result,
        visitor: ({ fieldPath }) => {
          newFields.push(fieldPath);
        },
      });
      expect(newFields).to.deep.equal([
        ['mixedArrayField'],
        ['mixedArrayField', 'field1'],
        ['mixedArrayField', 'field2'],
      ]);
    });

    it('add a field to a mixed type [anyOf, items, properties]', function () {
      const schema = {
        type: 'object',
        properties: {
          maybeArrayField: {
            anyOf: [
              { bsonType: 'string' },
              {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    field1: {
                      bsonType: 'string',
                    },
                  },
                },
              },
            ],
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['maybeArrayField'],
        jsonSchema: schema,
        updateParameters: {
          update: 'addField',
          newFieldName: 'field2',
          newFieldSchema: { bsonType: 'string' },
        },
      });
      const newFields: FieldPath[] = [];
      traverseSchema({
        jsonSchema: result,
        visitor: ({ fieldPath }) => {
          newFields.push(fieldPath);
        },
      });
      expect(newFields).to.deep.equal([
        ['maybeArrayField'],
        ['maybeArrayField', 'field1'],
        ['maybeArrayField', 'field2'],
      ]);
    });
  });
});

describe('renameField', function () {
  describe('field not found', function () {
    it('empty schema', function () {
      const result = updateSchema({
        fieldPath: ['name'],
        jsonSchema: {},
        updateParameters: {
          update: 'renameField',
          newFieldName: 'newName',
        },
      });
      expect(result).to.deep.equal({});
    });

    it('wrong path', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          person: {
            bsonType: 'object',
            properties: {
              age: { bsonType: 'int' },
              name: { bsonType: 'string' },
            },
          },
          address: {
            bsonType: 'object',
            properties: {
              street: { bsonType: 'string' },
              city: { bsonType: 'string' },
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['address', 'age'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'newName',
        },
      });
      expect(result).to.deep.equal(schema);
    });
  });

  describe('flat schema', function () {
    it('rename top level field', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          name: { bsonType: 'string' },
          age: { bsonType: ['string', 'int'] },
        },
      };
      const result = updateSchema({
        fieldPath: ['name'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'newName',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          newName: schema.properties.name,
          age: schema.properties.age,
        },
      });
    });

    it('update required', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          name: { bsonType: 'string' },
          age: { bsonType: ['string', 'int'] },
        },
        required: ['name', 'age'],
      };
      const result = updateSchema({
        fieldPath: ['name'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'newName',
        },
      });
      expect(result.required).to.deep.equal(['newName', 'age']);
    });
  });

  describe('nested schema', function () {
    it('rename a field from the middle level', function () {
      const schema = {
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
      };
      const result = updateSchema({
        fieldPath: ['person', 'address'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'location',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          person: {
            ...schema.properties.person,
            properties: {
              name: schema.properties.person.properties.name,
              location: schema.properties.person.properties.address,
            },
          },
        },
      });
    });

    it('rename a deeply nested field', function () {
      const schema = {
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
      };
      const result = updateSchema({
        fieldPath: ['person', 'address', 'city'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'town',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          person: {
            ...schema.properties.person,
            properties: {
              name: schema.properties.person.properties.name,
              address: {
                ...schema.properties.person.properties.address,
                properties: {
                  street:
                    schema.properties.person.properties.address.properties
                      .street,
                  town: schema.properties.person.properties.address.properties
                    .city,
                },
              },
            },
          },
        },
      });
    });

    it('rename field nested in a mixed type', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          names: {
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
      };
      const result = updateSchema({
        fieldPath: ['names', 'first'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'given',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          names: {
            anyOf: [
              { bsonType: 'string' },
              {
                bsonType: 'object',
                properties: {
                  last: { bsonType: 'string' },
                  given: { bsonType: 'string' },
                },
              },
            ],
          },
        },
      });
    });

    it('nested in an array of objects', function () {
      const schema = {
        bsonType: 'object',
        properties: {
          addresses: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              properties: {
                street: { bsonType: 'string' },
                streetNumber: { bsonType: ['int', 'string'] },
                city: { bsonType: 'string' },
              },
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['addresses', 'streetNumber'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'street_num',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          addresses: {
            ...schema.properties.addresses,
            items: {
              ...schema.properties.addresses.items,
              properties: {
                street: { bsonType: 'string' },
                city: { bsonType: 'string' },
                street_num: { bsonType: ['int', 'string'] },
              },
            },
          },
        },
      });
    });

    it('nested in an array of mixed items (including objects)', function () {
      const schema = {
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
                    completed: { bsonType: 'bool' },
                  },
                },
                { bsonType: 'string' },
              ],
            },
          },
        },
      };
      const result = updateSchema({
        fieldPath: ['todos', 'completed'],
        jsonSchema: schema,
        updateParameters: {
          update: 'renameField',
          newFieldName: 'done',
        },
      });
      expect(result).to.deep.equal({
        ...schema,
        properties: {
          todos: {
            bsonType: 'array',
            items: {
              anyOf: [
                {
                  bsonType: 'object',
                  properties: {
                    title: { bsonType: 'string' },
                    done: { bsonType: 'bool' },
                  },
                },
                { bsonType: 'string' },
              ],
            },
          },
        },
      });
    });
  });
});

describe('getSchemaWithNewTypes', function () {
  describe('basic types', function () {
    it('updates a single type', function () {
      const newTypes = ['string', 'int'];
      const result = getSchemaWithNewTypes({ bsonType: 'string' }, newTypes);
      expect(result).to.deep.equal({ bsonType: newTypes });
    });

    it('updates an array of types', function () {
      const newTypes = ['bool', 'int'];
      const result = getSchemaWithNewTypes(
        { bsonType: ['string', 'bool'] },
        newTypes
      );
      expect(result).to.deep.equal({ bsonType: newTypes });
    });
  });

  describe('complex types', function () {
    describe('cleans up the root schema', function () {
      it('changes an object to a string', function () {
        const newTypes = ['string'];
        const result = getSchemaWithNewTypes(
          {
            bsonType: 'object',
            properties: {
              name: { bsonType: 'string' },
            },
            required: ['name'],
          },
          newTypes
        );
        expect(result).to.deep.equal({ bsonType: newTypes });
      });

      it('changes an array to a string', function () {
        const newTypes = ['string'];
        const result = getSchemaWithNewTypes(
          {
            bsonType: 'array',
            items: {
              bsonType: 'int',
            },
          },
          newTypes
        );
        expect(result).to.deep.equal({ bsonType: newTypes });
      });
    });

    describe('cleans up parts of anyOf', function () {
      it('removes object but keeps array', function () {
        const newTypes = ['array'];
        const oldSchema = {
          anyOf: [
            {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
              },
              required: ['name'],
            },
            {
              bsonType: 'array',
              items: {
                properties: {
                  name: { bsonType: 'string' },
                },
                required: ['name'],
              },
            },
          ],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        // array is no longer part of anyOf, now it is the only type and so the root schema
        expect(result).to.deep.equal(oldSchema.anyOf[1]);
      });

      it('removes array but keeps object', function () {
        const newTypes = ['object'];
        const oldSchema = {
          anyOf: [
            {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
              },
              required: ['name'],
            },
            {
              bsonType: 'array',
              items: {
                properties: {
                  name: { bsonType: 'string' },
                },
                required: ['name'],
              },
            },
          ],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        // object is no longer part of anyOf, now it is the only type and so the root schema
        expect(result).to.deep.equal(oldSchema.anyOf[0]);
      });

      it('removes one of many types', function () {
        const newTypes = ['object', 'array', 'string', 'bool']; // removes int
        const oldSchema = {
          anyOf: [
            {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
              },
              required: ['name'],
            },
            {
              bsonType: 'array',
              items: {
                properties: {
                  name: { bsonType: 'string' },
                },
                required: ['name'],
              },
            },
            {
              bsonType: 'string',
            },
            {
              bsonType: 'int',
            },
            {
              bsonType: 'bool',
            },
          ],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).to.not.to.have.property('bsonType');
        expect(result.anyOf).to.have.lengthOf(4);
        expect(result.anyOf).to.have.deep.members([
          oldSchema.anyOf[0],
          oldSchema.anyOf[1],
          oldSchema.anyOf[2],
          // int - is missing
          oldSchema.anyOf[4],
        ]);
        expect(result.anyOf).to.not.have.deep.members([
          oldSchema.anyOf[3], // int - is missing
        ]);
      });
    });

    describe('uses anyOf for a mixture of simple and complex types', function () {
      it('adds another type on top of object and array', function () {
        const newTypes = ['object', 'array', 'bool'];
        const oldSchema = {
          anyOf: [
            {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
              },
              required: ['name'],
            },
            {
              bsonType: 'array',
              items: {
                properties: {
                  name: { bsonType: 'string' },
                },
                required: ['name'],
              },
            },
          ],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('bsonType');
        expect(result.anyOf).to.have.lengthOf(3);
        expect(result.anyOf).to.have.deep.members([
          oldSchema.anyOf[0],
          oldSchema.anyOf[1],
          {
            bsonType: 'bool',
          },
        ]);
      });

      it('adds object alongside a string', function () {
        const newTypes = ['string', 'object'];
        const oldSchema = {
          bsonType: 'string',
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('bsonType');
        expect(result.anyOf).to.have.lengthOf(2);
        expect(result.anyOf).to.deep.include({
          bsonType: 'string',
        });
        expect(result.anyOf).to.deep.include({
          bsonType: 'object',
          properties: {},
          required: [],
        });
      });

      it('adds array alongside a string', function () {
        const newTypes = ['string', 'array'];
        const oldSchema = {
          bsonType: 'string',
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('bsonType');
        expect(result.anyOf).to.have.lengthOf(2);
        expect(result.anyOf).to.deep.include({
          bsonType: 'string',
        });
        expect(result.anyOf).to.deep.include({
          bsonType: 'array',
          items: {},
        });
      });

      it('adds string alongside an object', function () {
        const newTypes = ['string', 'object'];
        const oldSchema = {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
          },
          required: ['name'],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('bsonType');
        expect(result).not.to.have.property('properties');
        expect(result).not.to.have.property('required');
        expect(result.anyOf).to.have.lengthOf(2);
        expect(result.anyOf).to.have.deep.members([
          {
            bsonType: 'string',
          },
          oldSchema,
        ]);
      });

      it('adds string alongside an array', function () {
        const newTypes = ['string', 'array'];
        const oldSchema = {
          bsonType: 'array',
          items: { bsonType: 'int' },
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('bsonType');
        expect(result).not.to.have.property('items');
        expect(result.anyOf).to.have.lengthOf(2);
        expect(result.anyOf).to.have.deep.members([
          {
            bsonType: 'string',
          },
          oldSchema,
        ]);
      });
    });

    describe('cleans up anyOf when it is no longer needed', function () {
      it('removes array from a mixed type', function () {
        const newTypes = ['int', 'double'];
        const oldSchema = {
          anyOf: [
            {
              bsonType: 'array',
              items: [{ bsonType: 'string' }],
            },
            {
              bsonType: 'int',
            },
            {
              bsonType: 'double',
            },
          ],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('anyOf');
        expect(result).to.deep.equal({ bsonType: newTypes });
      });

      it('removes object from a mixed type', function () {
        const newTypes = ['int', 'bool'];
        const oldSchema = {
          anyOf: [
            {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
              },
              required: ['name'],
            },
            {
              bsonType: 'int',
            },
            {
              bsonType: 'bool',
            },
          ],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('anyOf');
        expect(result).to.deep.equal({ bsonType: newTypes });
      });

      it('removes string from a mixed type, leaving object', function () {
        const newTypes = ['object'];
        const oldSchema = {
          anyOf: [
            {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
              },
              required: ['name'],
            },
            {
              bsonType: 'string',
            },
          ],
        };
        const result = getSchemaWithNewTypes(oldSchema, newTypes);
        expect(result).not.to.have.property('anyOf');
        expect(result).to.deep.equal(oldSchema.anyOf[0]);
      });
    });
  });
});
