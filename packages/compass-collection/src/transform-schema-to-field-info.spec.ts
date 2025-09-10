/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import {
  Int32,
  Double,
  ObjectId,
  Binary,
  BSONRegExp,
  Code,
  BSONSymbol,
  Timestamp,
  MaxKey,
  MinKey,
  Long,
  Decimal128,
} from 'bson';
import { processSchema } from './transform-schema-to-field-info';
import type { Schema } from 'mongodb-schema';

describe('processSchema', function () {
  it('selects most probable type when multiple types exist', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'mixed',
          path: ['mixed'],
          count: 10,
          type: ['String', 'Number'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['mixed'],
              count: 8,
              probability: 0.8,
              values: ['text'],
            },
            {
              name: 'Number',
              bsonType: 'Number',
              path: ['mixed'],
              count: 2,
              probability: 0.2,
              values: [new Int32(42)],
            },
          ],
        },
      ],
      count: 10,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      mixed: {
        type: 'String', // Should pick the most probable type
        sample_values: ['text'],
        probability: 1.0,
      },
    });
  });

  it('filters out undefined and null types', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'optional',
          path: ['optional'],
          count: 3,
          type: ['String', 'Undefined', 'Null'],
          probability: 0.67,
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['optional'],
              count: 1,
              probability: 0.33,
              values: ['value'],
            },
            {
              name: 'Undefined',
              bsonType: 'Undefined',
              path: ['optional'],
              count: 1,
              probability: 0.33,
            },
            {
              name: 'Null',
              bsonType: 'Null',
              path: ['optional'],
              count: 1,
              probability: 0.33,
            },
          ],
        },
      ],
      count: 3,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      optional: {
        type: 'String',
        sample_values: ['value'],
        probability: 0.67,
      },
    });
  });

  it('handles fields with no types', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'empty',
          path: ['empty'],
          count: 0,
          type: [],
          hasDuplicates: false,
          probability: 0.0,
          types: [],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({});
  });

  it('handles empty schema', function () {
    const schema: Schema = {
      fields: [],
      count: 0,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({});
  });

  it('limits sample values to 10', function () {
    const manyValues = Array.from({ length: 20 }, (_, i) => `value${i}`);

    const schema: Schema = {
      fields: [
        {
          name: 'field',
          path: ['field'],
          count: 20,
          type: ['String'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['field'],
              count: 20,
              probability: 1.0,
              values: manyValues,
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result.field.sample_values).to.have.length(10);
    expect(result.field.sample_values).to.deep.equal(manyValues.slice(0, 10));
  });

  it('transforms simple primitive fields', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'name',
          path: ['name'],
          count: 3,
          type: ['String'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['name'],
              count: 3,
              probability: 1.0,
              values: ['John', 'Jane', 'Bob'],
            },
          ],
        },
        {
          name: 'age',
          path: ['age'],
          count: 3,
          type: ['Number'],
          probability: 0.9,
          hasDuplicates: false,
          types: [
            {
              name: 'Number',
              bsonType: 'Number',
              path: ['age'],
              count: 3,
              probability: 1.0,
              values: [new Int32(25), new Int32(30), new Int32(35)],
            },
          ],
        },
        {
          name: 'isActive',
          path: ['isActive'],
          count: 3,
          type: ['Boolean'],
          probability: 0.8,
          hasDuplicates: false,
          types: [
            {
              name: 'Boolean',
              bsonType: 'Boolean',
              path: ['isActive'],
              count: 3,
              probability: 1.0,
              values: [true, false, true],
            },
          ],
        },
        {
          name: 'createdAt',
          path: ['createdAt'],
          count: 2,
          type: ['Date'],
          probability: 0.7,
          hasDuplicates: false,
          types: [
            {
              name: 'Date',
              bsonType: 'Date',
              path: ['createdAt'],
              count: 2,
              probability: 1.0,
              values: [new Date('2023-01-01'), new Date('2023-06-15')],
            },
          ],
        },
      ],
      count: 3,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      name: {
        type: 'String',
        sample_values: ['John', 'Jane', 'Bob'],
        probability: 1.0,
      },
      age: {
        type: 'Number',
        sample_values: [25, 30, 35],
        probability: 0.9,
      },
      isActive: {
        type: 'Boolean',
        sample_values: [true, false, true],
        probability: 0.8,
      },
      createdAt: {
        type: 'Date',
        sample_values: [new Date('2023-01-01'), new Date('2023-06-15')],
        probability: 0.7,
      },
    });
  });

  it('handles various BSON types', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'objectId',
          path: ['objectId'],
          count: 1,
          type: ['ObjectId'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'ObjectId',
              bsonType: 'ObjectId',
              path: ['objectId'],
              count: 1,
              probability: 1.0,
              values: [new ObjectId('642d766b7300158b1f22e972')],
            },
          ],
        },
        {
          name: 'binary',
          path: ['binary'],
          count: 1,
          type: ['Binary'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Binary',
              bsonType: 'Binary',
              path: ['binary'],
              count: 1,
              probability: 1.0,
              values: [new Binary(Buffer.from('test'))],
            },
          ],
        },
        {
          name: 'regex',
          path: ['regex'],
          count: 1,
          type: ['RegExp'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'RegExp',
              bsonType: 'BSONRegExp',
              path: ['regex'],
              count: 1,
              probability: 1.0,
              values: [new BSONRegExp('pattern', 'i')],
            },
          ],
        },
        {
          name: 'code',
          path: ['code'],
          count: 1,
          type: ['Code'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Code',
              bsonType: 'Code',
              path: ['code'],
              count: 1,
              probability: 1.0,
              values: [new Code('function() {}')],
            },
          ],
        },
        {
          name: 'long',
          path: ['long'],
          count: 1,
          type: ['Long'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Long',
              bsonType: 'Long',
              path: ['long'],
              count: 1,
              probability: 1.0,
              values: [Long.fromNumber(123456789)],
            },
          ],
        },
        {
          name: 'decimal',
          path: ['decimal'],
          count: 1,
          type: ['Decimal128'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Decimal128',
              bsonType: 'Decimal128',
              path: ['decimal'],
              count: 1,
              probability: 1.0,
              values: [Decimal128.fromString('123.456')],
            },
          ],
        },
        {
          name: 'timestamp',
          path: ['timestamp'],
          count: 1,
          type: ['Timestamp'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Timestamp',
              bsonType: 'Timestamp',
              path: ['timestamp'],
              count: 1,
              probability: 1.0,
              values: [new Timestamp({ t: 1, i: 1 })],
            },
          ],
        },
        {
          name: 'maxKey',
          path: ['maxKey'],
          count: 1,
          type: ['MaxKey'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'MaxKey',
              bsonType: 'MaxKey',
              path: ['maxKey'],
              count: 1,
              probability: 1.0,
              values: [new MaxKey()],
            },
          ],
        },
        {
          name: 'minKey',
          path: ['minKey'],
          count: 1,
          type: ['MinKey'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'MinKey',
              bsonType: 'MinKey',
              path: ['minKey'],
              count: 1,
              probability: 1.0,
              values: [new MinKey()],
            },
          ],
        },
        {
          name: 'symbol',
          path: ['symbol'],
          count: 1,
          type: ['Symbol'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Symbol',
              bsonType: 'BSONSymbol',
              path: ['symbol'],
              count: 1,
              probability: 1.0,
              values: [new BSONSymbol('symbol')],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      objectId: {
        type: 'ObjectId',
        sample_values: ['642d766b7300158b1f22e972'],
        probability: 1.0,
      },
      binary: {
        type: 'Binary',
        sample_values: ['dGVzdA=='],
        probability: 1.0,
      },
      regex: {
        type: 'RegExp',
        sample_values: ['pattern'],
        probability: 1.0,
      },
      code: {
        type: 'Code',
        sample_values: ['function() {}'],
        probability: 1.0,
      },
      long: {
        type: 'Long',
        sample_values: [123456789],
        probability: 1.0,
      },
      decimal: {
        type: 'Decimal128',
        sample_values: [123.456],
        probability: 1.0,
      },
      timestamp: {
        type: 'Timestamp',
        sample_values: [4294967297],
        probability: 1.0,
      },
      maxKey: {
        type: 'MaxKey',
        sample_values: ['MaxKey'],
        probability: 1.0,
      },
      minKey: {
        type: 'MinKey',
        sample_values: ['MinKey'],
        probability: 1.0,
      },
      symbol: {
        type: 'Symbol',
        sample_values: ['symbol'],
        probability: 1.0,
      },
    });
  });

  it('transforms nested document field', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'user',
          path: ['user'],
          count: 2,
          type: ['Document'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Document',
              bsonType: 'Document',
              path: ['user'],
              count: 2,
              probability: 1.0,
              fields: [
                {
                  name: 'name',
                  path: ['user', 'name'],
                  count: 1,
                  type: ['String'],
                  probability: 1.0,
                  hasDuplicates: false,
                  types: [
                    {
                      name: 'String',
                      bsonType: 'String',
                      path: ['user', 'name'],
                      count: 1,
                      probability: 1.0,
                      values: ['John'],
                    },
                  ],
                },
                {
                  name: 'age',
                  path: ['user', 'age'],
                  count: 2,
                  type: ['Number'],
                  probability: 0.8,
                  hasDuplicates: false,
                  types: [
                    {
                      name: 'Number',
                      bsonType: 'Number',
                      path: ['user', 'age'],
                      count: 2,
                      probability: 1.0,
                      values: [new Int32(25), new Int32(30)],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      count: 2,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'user.name': {
        type: 'String',
        sample_values: ['John'],
        probability: 1.0,
      },
      'user.age': {
        type: 'Number',
        sample_values: [25, 30],
        probability: 0.8,
      },
    });
  });

  it('transforms array field', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'tags',
          path: ['tags'],
          count: 2,
          type: ['Array'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Array',
              bsonType: 'Array',
              path: ['tags'],
              count: 2,
              probability: 1.0,

              lengths: [2, 1],
              averageLength: 1.5,
              totalCount: 3,
              types: [
                {
                  name: 'String',
                  bsonType: 'String',
                  path: ['tags'],
                  count: 3,
                  probability: 1.0,
                  values: ['red', 'blue', 'green'],
                },
              ],
            },
          ],
        },
      ],
      count: 2,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'tags[]': {
        type: 'String',
        sample_values: ['red', 'blue', 'green'],
        probability: 1.0,
      },
    });
  });

  it('handles deeply nested objects (documents)', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'level1',
          path: ['level1'],
          count: 1,
          type: ['Document'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Document',
              bsonType: 'Document',
              path: ['level1'],
              count: 1,
              probability: 1.0,
              fields: [
                {
                  name: 'level2',
                  path: ['level1', 'level2'],
                  count: 1,
                  type: ['Document'],
                  probability: 1.0,
                  hasDuplicates: false,
                  types: [
                    {
                      name: 'Document',
                      bsonType: 'Document',
                      path: ['level1', 'level2'],
                      count: 1,
                      probability: 1.0,
                      fields: [
                        {
                          name: 'value',
                          path: ['level1', 'level2', 'value'],
                          count: 1,
                          type: ['String'],
                          probability: 1.0,
                          hasDuplicates: false,
                          types: [
                            {
                              name: 'String',
                              bsonType: 'String',
                              path: ['level1', 'level2', 'value'],
                              count: 1,
                              probability: 1.0,
                              values: ['deep'],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'level1.level2.value': {
        type: 'String',
        sample_values: ['deep'],
        probability: 1.0,
      },
    });
  });

  it('handles arrays of documents', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'items',
          path: ['items'],
          count: 1,
          type: ['Array'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Array',
              bsonType: 'Array',
              path: ['items'],
              count: 1,
              probability: 1.0,
              lengths: [2],
              averageLength: 2,
              totalCount: 2,
              types: [
                {
                  name: 'Document',
                  bsonType: 'Document',
                  path: ['items'],
                  count: 2,
                  probability: 1.0,
                  fields: [
                    {
                      name: 'id',
                      path: ['items', 'id'],
                      count: 2,
                      type: ['Number'],
                      probability: 1.0,
                      hasDuplicates: false,
                      types: [
                        {
                          name: 'Number',
                          bsonType: 'Number',
                          path: ['items', 'id'],
                          count: 2,
                          probability: 1.0,
                          values: [new Int32(1), new Int32(2)],
                        },
                      ],
                    },
                    {
                      name: 'cost',
                      path: ['items', 'cost'],
                      count: 2,
                      type: ['Double'],
                      probability: 1.0,
                      hasDuplicates: false,
                      types: [
                        {
                          name: 'Number',
                          bsonType: 'Number',
                          path: ['items', 'cost'],
                          count: 2,
                          probability: 1.0,
                          values: [new Double(10.5), new Double(25.0)],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'items[].id': {
        type: 'Number',
        sample_values: [1, 2],
        probability: 1.0,
      },
      'items[].cost': {
        type: 'Number',
        sample_values: [10.5, 25.0],
        probability: 1.0,
      },
    });
  });

  it('handles triple nested arrays (3D matrix)', function () {
    // cube: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    const schema: Schema = {
      fields: [
        {
          name: 'cube',
          path: ['cube'],
          count: 1,
          type: ['Array'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Array',
              bsonType: 'Array',
              path: ['cube'],
              count: 1,
              probability: 1.0,
              lengths: [2],
              averageLength: 2,
              totalCount: 2,
              types: [
                {
                  name: 'Array',
                  bsonType: 'Array',
                  path: ['cube'],
                  count: 2,
                  probability: 1.0,
                  lengths: [2],
                  averageLength: 2,
                  totalCount: 4,
                  types: [
                    {
                      name: 'Array',
                      bsonType: 'Array',
                      path: ['cube'],
                      count: 4,
                      probability: 1.0,
                      lengths: [2],
                      averageLength: 2,
                      totalCount: 8,
                      types: [
                        {
                          name: 'Number',
                          bsonType: 'Number',
                          path: ['cube'],
                          count: 8,
                          probability: 1.0,
                          values: [
                            new Int32(1),
                            new Int32(2),
                            new Int32(3),
                            new Int32(4),
                            new Int32(5),
                            new Int32(6),
                            new Int32(7),
                            new Int32(8),
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'cube[][][]': {
        type: 'Number',
        sample_values: [1, 2, 3, 4, 5, 6, 7, 8],
        probability: 1.0,
      },
    });
  });

  it('handles arrays of arrays of documents', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'matrix',
          path: ['matrix'],
          count: 1,
          type: ['Array'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Array',
              bsonType: 'Array',
              path: ['matrix'],
              count: 1,
              probability: 1.0,
              lengths: [2],
              averageLength: 2,
              totalCount: 2,

              types: [
                {
                  name: 'Array',
                  bsonType: 'Array',
                  path: ['matrix'],
                  count: 2,
                  probability: 1.0,
                  lengths: [1],
                  averageLength: 1,
                  totalCount: 2,

                  types: [
                    {
                      name: 'Document',
                      bsonType: 'Document',
                      path: ['matrix'],
                      count: 2,
                      probability: 1.0,
                      fields: [
                        {
                          name: 'x',
                          path: ['matrix', 'x'],
                          count: 2,
                          type: ['Number'],
                          probability: 1.0,
                          hasDuplicates: false,
                          types: [
                            {
                              name: 'Number',
                              bsonType: 'Number',
                              path: ['matrix', 'x'],
                              count: 2,
                              probability: 1.0,
                              values: [new Int32(1), new Int32(3)],
                            },
                          ],
                        },
                        {
                          name: 'y',
                          path: ['matrix', 'y'],
                          count: 2,
                          type: ['Number'],
                          probability: 1.0,
                          hasDuplicates: false,
                          types: [
                            {
                              name: 'Number',
                              bsonType: 'Number',
                              path: ['matrix', 'y'],
                              count: 2,
                              probability: 1.0,
                              values: [new Int32(2), new Int32(4)],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'matrix[][].x': {
        type: 'Number',
        sample_values: [1, 3],
        probability: 1.0,
      },
      'matrix[][].y': {
        type: 'Number',
        sample_values: [2, 4],
        probability: 1.0,
      },
    });
  });

  it('handles array of documents with nested arrays', function () {
    // teams: [{ name: "Team A", members: ["Alice", "Bob"] }, { name: "Team B", members: ["Charlie"] }]
    const schema: Schema = {
      fields: [
        {
          name: 'teams',
          path: ['teams'],
          count: 1,
          type: ['Array'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Array',
              bsonType: 'Array',
              path: ['teams'],
              count: 1,
              probability: 1.0,
              lengths: [2],
              averageLength: 2,
              totalCount: 2,

              types: [
                {
                  name: 'Document',
                  bsonType: 'Document',
                  path: ['teams'],
                  count: 2,
                  probability: 1.0,
                  fields: [
                    {
                      name: 'name',
                      path: ['teams', 'name'],
                      count: 2,
                      type: ['String'],
                      probability: 1.0,
                      hasDuplicates: false,
                      types: [
                        {
                          name: 'String',
                          bsonType: 'String',
                          path: ['teams', 'name'],
                          count: 2,
                          probability: 1.0,
                          values: ['Team A', 'Team B'],
                        },
                      ],
                    },
                    {
                      name: 'members',
                      path: ['teams', 'members'],
                      count: 2,
                      type: ['Array'],
                      probability: 1.0,
                      hasDuplicates: false,
                      types: [
                        {
                          name: 'Array',
                          bsonType: 'Array',
                          path: ['teams', 'members'],
                          count: 2,
                          probability: 1.0,
                          lengths: [2, 1],
                          averageLength: 1.5,
                          totalCount: 3,
                          types: [
                            {
                              name: 'String',
                              bsonType: 'String',
                              path: ['teams', 'members'],
                              count: 3,
                              probability: 1.0,
                              values: ['Alice', 'Bob', 'Charlie'],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'teams[].name': {
        type: 'String',
        sample_values: ['Team A', 'Team B'],
        probability: 1.0,
      },
      'teams[].members[]': {
        type: 'String',
        sample_values: ['Alice', 'Bob', 'Charlie'],
        probability: 1.0,
      },
    });
  });

  /**
   * Verifies malformed field paths can be caught by bugs in the construction logic.
   * These are unlikely to occur with valid `Schema` inputs to `processSchema`.
   */
  describe('validateFieldPath error conditions', function () {
    it('throws error for incomplete brackets in middle of field part', function () {
      const schema: Schema = {
        fields: [
          {
            name: 'field[invalid', // Incomplete bracket
            path: ['field[invalid'],
            count: 1,
            type: ['String'],
            probability: 1.0,
            hasDuplicates: false,
            types: [
              {
                name: 'String',
                bsonType: 'String',
                path: ['field[invalid'],
                count: 1,
                probability: 1.0,
                values: ['test'],
              },
            ],
          },
        ],
        count: 1,
      };

      expect(() => processSchema(schema)).to.throw(
        "invalid fieldPath 'field[invalid': '[]' can only appear at the end of field parts"
      );
    });

    it('throws error for brackets in middle of field part', function () {
      const schema: Schema = {
        fields: [
          {
            name: 'field[]invalid', // Brackets in middle
            path: ['field[]invalid'],
            count: 1,
            type: ['String'],
            probability: 1.0,
            hasDuplicates: false,
            types: [
              {
                name: 'String',
                bsonType: 'String',
                path: ['field[]invalid'],
                count: 1,
                probability: 1.0,
                values: ['test'],
              },
            ],
          },
        ],
        count: 1,
      };

      expect(() => processSchema(schema)).to.throw(
        "invalid fieldPath 'field[]invalid': '[]' can only appear at the end of field parts"
      );
    });

    it('throws error for empty field parts', function () {
      const schema: Schema = {
        fields: [
          {
            name: 'parent',
            path: ['parent'],
            count: 1,
            type: ['Document'],
            probability: 1.0,
            hasDuplicates: false,
            types: [
              {
                name: 'Document',
                bsonType: 'Document',
                path: ['parent'],
                count: 1,
                probability: 1.0,
                fields: [
                  {
                    name: '', // Empty field name
                    path: ['parent', ''],
                    count: 1,
                    type: ['String'],
                    probability: 1.0,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'String',
                        bsonType: 'String',
                        path: ['parent', ''],
                        count: 1,
                        probability: 1.0,
                        values: ['test'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        count: 1,
      };

      expect(() => processSchema(schema)).to.throw(
        "invalid fieldPath 'parent.': field parts cannot be empty"
      );
    });

    it('throws error for a field part that only contains "[]"', function () {
      const schema: Schema = {
        fields: [
          {
            name: '[]', // Field name is just "[]"
            path: ['[]'],
            count: 1,
            type: ['String'],
            probability: 1.0,
            hasDuplicates: false,
            types: [
              {
                name: 'String',
                bsonType: 'String',
                path: ['[]'],
                count: 1,
                probability: 1.0,
                values: ['test'],
              },
            ],
          },
        ],
        count: 1,
      };

      expect(() => processSchema(schema)).to.throw(
        "invalid fieldPath '[]': field parts must have characters other than '[]'"
      );
    });
  });
});
