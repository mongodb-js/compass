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

    expect(result.fieldInfo).to.deep.equal({
      mixed: {
        type: 'String', // Should pick the most probable type
        sampleValues: ['text'],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({});
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

    expect(result.fieldInfo).to.deep.equal({
      optional: {
        type: 'String',
        sampleValues: ['value'],
        probability: 0.67,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({});
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

    expect(result.fieldInfo).to.deep.equal({});
    expect(result.arrayLengthMap).to.deep.equal({});
  });

  it('handles empty schema', function () {
    const schema: Schema = {
      fields: [],
      count: 0,
    };

    const result = processSchema(schema);

    expect(result.fieldInfo).to.deep.equal({});
    expect(result.arrayLengthMap).to.deep.equal({});
  });

  it('limits sample values to 5', function () {
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

    expect(result.fieldInfo.field.sampleValues).to.have.length(5);
    expect(result.fieldInfo.field.sampleValues).to.deep.equal(
      manyValues.slice(0, 5)
    );
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

    expect(result.fieldInfo).to.deep.equal({
      name: {
        type: 'String',
        sampleValues: ['John', 'Jane', 'Bob'],
        probability: 1.0,
      },
      age: {
        type: 'Number',
        sampleValues: [25, 30, 35],
        probability: 0.9,
      },
      isActive: {
        type: 'Boolean',
        sampleValues: [true, false, true],
        probability: 0.8,
      },
      createdAt: {
        type: 'Date',
        sampleValues: [new Date('2023-01-01'), new Date('2023-06-15')],
        probability: 0.7,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({});
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

    expect(result.fieldInfo).to.deep.equal({
      objectId: {
        type: 'ObjectId',
        sampleValues: ['642d766b7300158b1f22e972'],
        probability: 1.0,
      },
      binary: {
        type: 'Binary',
        // sampleValues property should be absent for Binary fields
        probability: 1.0,
      },
      regex: {
        type: 'RegExp',
        sampleValues: ['pattern'],
        probability: 1.0,
      },
      code: {
        type: 'Code',
        sampleValues: ['function() {}'],
        probability: 1.0,
      },
      long: {
        type: 'Long',
        sampleValues: [123456789],
        probability: 1.0,
      },
      decimal: {
        type: 'Decimal128',
        sampleValues: [123.456],
        probability: 1.0,
      },
      timestamp: {
        type: 'Timestamp',
        sampleValues: [4294967297],
        probability: 1.0,
      },
      maxKey: {
        type: 'MaxKey',
        sampleValues: ['MaxKey'],
        probability: 1.0,
      },
      minKey: {
        type: 'MinKey',
        sampleValues: ['MinKey'],
        probability: 1.0,
      },
      symbol: {
        type: 'Symbol',
        sampleValues: ['symbol'],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({});
  });

  it('excludes sample values for Binary fields to avoid massive payloads', function () {
    const embedding = new Binary(Buffer.from([1, 2, 3, 4])); // Test Binary field logic
    const schema: Schema = {
      fields: [
        {
          name: 'plot_embedding',
          path: ['plot_embedding'],
          count: 1,
          type: ['Binary'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'Binary',
              bsonType: 'Binary',
              path: ['plot_embedding'],
              count: 1,
              probability: 1.0,
              values: [embedding],
            },
          ],
        },
        {
          name: 'regular_field',
          path: ['regular_field'],
          count: 1,
          type: ['String'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['regular_field'],
              count: 1,
              probability: 1.0,
              values: ['test'],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result.fieldInfo).to.deep.equal({
      plot_embedding: {
        type: 'Binary',
        // sampleValues property should be absent for Binary fields
        probability: 1.0,
      },
      regular_field: {
        type: 'String',
        sampleValues: ['test'], // Should still have sample values for non-Binary fields
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({});
  });

  it('truncates very long sample values to prevent massive payloads', function () {
    const longText = 'A'.repeat(1000);
    const schema: Schema = {
      fields: [
        {
          name: 'longField',
          path: ['longField'],
          count: 1,
          type: ['String'],
          probability: 1.0,
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['longField'],
              count: 1,
              probability: 1.0,
              values: [longText, 'short'],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result.fieldInfo.longField.sampleValues).to.have.length(2);
    expect(result.fieldInfo.longField.sampleValues![0]).to.equal(
      'A'.repeat(300) + '...'
    );
    expect(result.fieldInfo.longField.sampleValues![1]).to.equal('short');
  });

  it('rounds probability to 2 decimal places', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'field',
          path: ['field'],
          count: 1,
          type: ['String'],
          probability: 0.23076923076923078, // Very precise decimal
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['field'],
              count: 1,
              probability: 1.0,
              values: ['test'],
            },
          ],
        },
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result.fieldInfo.field.probability).to.equal(0.23); // Rounded to 2 decimal places
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

    expect(result.fieldInfo).to.deep.equal({
      'user.name': {
        type: 'String',
        sampleValues: ['John'],
        probability: 1.0,
      },
      'user.age': {
        type: 'Number',
        sampleValues: [25, 30],
        probability: 0.8,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({});
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

    expect(result.fieldInfo).to.deep.equal({
      'tags[]': {
        type: 'String',
        sampleValues: ['red', 'blue', 'green'],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({
      'tags[]': 2, // Math.round(1.5) = 2
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

    expect(result.fieldInfo).to.deep.equal({
      'level1.level2.value': {
        type: 'String',
        sampleValues: ['deep'],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({});
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

    expect(result.fieldInfo).to.deep.equal({
      'items[].id': {
        type: 'Number',
        sampleValues: [1, 2],
        probability: 1.0,
      },
      'items[].cost': {
        type: 'Number',
        sampleValues: [10.5, 25.0],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({
      'items[]': 2, // averageLength: 2
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

    expect(result.fieldInfo).to.deep.equal({
      'cube[][][]': {
        type: 'Number',
        sampleValues: [1, 2, 3, 4, 5],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({
      'cube[]': 2,
      'cube[][]': 2,
      'cube[][][]': 2,
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

    expect(result.fieldInfo).to.deep.equal({
      'matrix[][].x': {
        type: 'Number',
        sampleValues: [1, 3],
        probability: 1.0,
      },
      'matrix[][].y': {
        type: 'Number',
        sampleValues: [2, 4],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({
      'matrix[]': 2,
      'matrix[][]': 1,
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

    expect(result.fieldInfo).to.deep.equal({
      'teams[].name': {
        type: 'String',
        sampleValues: ['Team A', 'Team B'],
        probability: 1.0,
      },
      'teams[].members[]': {
        type: 'String',
        sampleValues: ['Alice', 'Bob', 'Charlie'],
        probability: 1.0,
      },
    });
    expect(result.arrayLengthMap).to.deep.equal({
      'teams[]': 2,
      'teams[].members[]': 2, // Math.round(1.5) = 2
    });
  });

  /**
   * Verifies malformed field paths can be caught by bugs in the construction logic.
   * These are unlikely to occur with valid `Schema` inputs to `processSchema`.
   */
  describe('validateFieldPath error conditions', function () {
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

  describe('Array Length Map', function () {
    it('should handle array length bounds (min 1, max 50)', function () {
      const schema: Schema = {
        fields: [
          {
            name: 'smallArray',
            path: ['smallArray'],
            count: 1,
            type: ['Array'],
            probability: 1.0,
            hasDuplicates: false,
            types: [
              {
                name: 'Array',
                bsonType: 'Array',
                path: ['smallArray'],
                count: 1,
                probability: 1.0,
                lengths: [0.3], // Very small average
                averageLength: 0.3,
                totalCount: 1,
                types: [
                  {
                    name: 'String',
                    bsonType: 'String',
                    path: ['smallArray'],
                    count: 1,
                    probability: 1.0,
                    values: ['test'],
                  },
                ],
              },
            ],
          },
          {
            name: 'largeArray',
            path: ['largeArray'],
            count: 1,
            type: ['Array'],
            probability: 1.0,
            hasDuplicates: false,
            types: [
              {
                name: 'Array',
                bsonType: 'Array',
                path: ['largeArray'],
                count: 1,
                probability: 1.0,
                lengths: [100], // Very large average
                averageLength: 100,
                totalCount: 100,
                types: [
                  {
                    name: 'Number',
                    bsonType: 'Number',
                    path: ['largeArray'],
                    count: 100,
                    probability: 1.0,
                    values: [new Int32(1)],
                  },
                ],
              },
            ],
          },
        ],
        count: 1,
      };

      const result = processSchema(schema);

      expect(result.arrayLengthMap).to.deep.equal({
        'smallArray[]': 1, // Min 1
        'largeArray[]': 50, // Max 50
      });
    });

    it('should handle missing averageLength with default', function () {
      const schema: Schema = {
        fields: [
          {
            name: 'defaultArray',
            path: ['defaultArray'],
            count: 1,
            type: ['Array'],
            probability: 1.0,
            hasDuplicates: false,
            types: [
              {
                name: 'Array',
                bsonType: 'Array',
                path: ['defaultArray'],
                count: 1,
                probability: 1.0,
                lengths: [2],
                // averageLength is undefined
                totalCount: 2,
                types: [
                  {
                    name: 'String',
                    bsonType: 'String',
                    path: ['defaultArray'],
                    count: 2,
                    probability: 1.0,
                    values: ['a', 'b'],
                  },
                ],
              },
            ],
          },
        ],
        count: 1,
      };

      const result = processSchema(schema);

      expect(result.arrayLengthMap).to.deep.equal({
        'defaultArray[]': 3, // DEFAULT_ARRAY_LENGTH = 3
      });
    });
  });
});
