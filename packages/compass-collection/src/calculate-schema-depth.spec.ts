import { expect } from 'chai';
import { calculateSchemaDepth } from './calculate-schema-depth';
import type {
  Schema,
  SchemaField,
  DocumentSchemaType,
  ArraySchemaType,
} from 'mongodb-schema';

describe('calculateSchemaDepth', function () {
  it('returns 1 for flat schema', async function () {
    const schema: Schema = {
      fields: [
        { name: 'a', types: [{ bsonType: 'String' }] } as SchemaField,
        { name: 'b', types: [{ bsonType: 'Number' }] } as SchemaField,
      ],
      count: 2,
    };
    const depth = await calculateSchemaDepth(schema);
    expect(depth).to.equal(1);
  });

  it('returns correct depth for nested document', async function () {
    const schema: Schema = {
      fields: [
        {
          name: 'a',
          types: [
            {
              bsonType: 'Document',
              fields: [
                {
                  name: 'b',
                  types: [
                    {
                      bsonType: 'Document',
                      fields: [
                        {
                          name: 'c',
                          types: [{ bsonType: 'String' }],
                        } as SchemaField,
                      ],
                    } as DocumentSchemaType,
                  ],
                } as SchemaField,
              ],
            } as DocumentSchemaType,
          ],
        } as SchemaField,
      ],
      count: 1,
    };
    const depth = await calculateSchemaDepth(schema);
    expect(depth).to.equal(3);
  });

  it('returns correct depth for nested arrays', async function () {
    const schema: Schema = {
      fields: [
        {
          name: 'arr',
          types: [
            {
              bsonType: 'Array',
              types: [
                {
                  bsonType: 'Array',
                  types: [
                    {
                      bsonType: 'Document',
                      fields: [
                        {
                          name: 'x',
                          types: [{ bsonType: 'String' }],
                        } as SchemaField,
                      ],
                    } as DocumentSchemaType,
                  ],
                } as ArraySchemaType,
              ],
            } as ArraySchemaType,
          ],
        } as SchemaField,
      ],
      count: 1,
    };
    const depth = await calculateSchemaDepth(schema);
    expect(depth).to.equal(4);
  });

  it('returns 0 for empty schema', async function () {
    const schema: Schema = { fields: [], count: 0 };
    const depth = await calculateSchemaDepth(schema);
    expect(depth).to.equal(0);
  });

  it('handles mixed types at root', async function () {
    const schema: Schema = {
      fields: [
        {
          name: 'a',
          types: [
            { bsonType: 'String' },
            {
              bsonType: 'Document',
              fields: [
                {
                  name: 'b',
                  types: [{ bsonType: 'Number' }],
                } as SchemaField,
              ],
            } as DocumentSchemaType,
          ],
        } as SchemaField,
      ],
      count: 1,
    };
    const depth = await calculateSchemaDepth(schema);
    expect(depth).to.equal(2);
  });

  it('handles deeply nested mixed arrays and documents', async function () {
    const schema: Schema = {
      fields: [
        {
          name: 'root',
          types: [
            {
              bsonType: 'Array',
              types: [
                {
                  bsonType: 'Document',
                  fields: [
                    {
                      name: 'nestedArr',
                      types: [
                        {
                          bsonType: 'Array',
                          types: [
                            {
                              bsonType: 'Document',
                              fields: [
                                {
                                  name: 'leaf',
                                  types: [{ bsonType: 'String' }],
                                } as SchemaField,
                              ],
                            } as DocumentSchemaType,
                          ],
                        } as ArraySchemaType,
                      ],
                    } as SchemaField,
                  ],
                } as DocumentSchemaType,
              ],
            } as ArraySchemaType,
          ],
        } as SchemaField,
      ],
      count: 1,
    };
    const depth = await calculateSchemaDepth(schema);
    expect(depth).to.equal(5);
  });
});
