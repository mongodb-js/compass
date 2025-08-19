/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import { Int32, Double } from 'bson';
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

  it('filters out undefined types', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'optional',
          path: ['optional'],
          count: 2,
          type: ['String', 'Undefined'],
          probability: 0.5,
          hasDuplicates: false,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['optional'],
              count: 1,
              probability: 0.5,
              values: ['value'],
            },
            {
              name: 'Undefined',
              bsonType: 'Undefined',
              path: ['optional'],
              count: 1,
              probability: 0.5,
            },
          ],
        },
      ],
      count: 2,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      optional: {
        type: 'String',
        sample_values: ['value'],
        probability: 0.5,
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

  it('transforms simple primitive field', function () {
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
});
