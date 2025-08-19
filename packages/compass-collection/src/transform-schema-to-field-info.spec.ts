import { expect } from 'chai';
import { processSchema } from './transform-schema-to-field-info';
import type {
  Schema,
  SchemaField,
  SchemaType,
  ArraySchemaType,
  DocumentSchemaType,
} from 'mongodb-schema';

describe('processSchema', function () {
  it('selects most probable type when multiple types exist', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'mixed',
          path: ['mixed'],
          probability: 1.0,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['mixed'],
              count: 8,
              probability: 0.8,
              values: ['text'],
            } as SchemaType,
            {
              name: 'Number',
              bsonType: 'Number',
              path: ['mixed'],
              count: 2,
              probability: 0.2,
              values: [42],
            } as SchemaType,
          ],
        } as SchemaField,
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
          probability: 0.5,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['optional'],
              count: 1,
              probability: 0.5,
              values: ['value'],
            } as SchemaType,
            {
              name: 'Undefined',
              bsonType: 'Undefined',
              path: ['optional'],
              count: 1,
              probability: 0.5,
            } as SchemaType,
          ],
        } as SchemaField,
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
        } as SchemaField,
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
          probability: 1.0,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['field'],
              count: 20,
              probability: 1.0,
              values: manyValues,
            } as SchemaType,
          ],
        } as SchemaField,
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
          probability: 1.0,
          types: [
            {
              name: 'String',
              bsonType: 'String',
              path: ['name'],
              count: 3,
              probability: 1.0,
              values: ['John', 'Jane', 'Bob'],
            } as SchemaType,
          ],
        } as SchemaField,
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
    });
  });

  it('transforms nested document field', function () {
    const schema: Schema = {
      fields: [
        {
          name: 'user',
          path: ['user'],
          probability: 1.0,
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
                  probability: 1.0,
                  types: [
                    {
                      name: 'String',
                      bsonType: 'String',
                      path: ['user', 'name'],
                      count: 1,
                      probability: 1.0,
                      values: ['John'],
                    } as SchemaType,
                  ],
                } as SchemaField,
                {
                  name: 'age',
                  path: ['user', 'age'],
                  probability: 0.8,
                  types: [
                    {
                      name: 'Number',
                      bsonType: 'Number',
                      path: ['user', 'age'],
                      count: 2,
                      probability: 1.0,
                      values: [25, 30],
                    } as SchemaType,
                  ],
                } as SchemaField,
              ],
            } as DocumentSchemaType,
          ],
        } as SchemaField,
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
          probability: 1.0,
          types: [
            {
              name: 'Array',
              bsonType: 'Array',
              path: ['tags'],
              count: 2,
              probability: 1.0,
              values: [['red', 'blue'], ['green']],
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
                } as SchemaType,
              ],
            } as ArraySchemaType,
          ],
        } as SchemaField,
      ],
      count: 2,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'tags[]': {
        type: 'String',
        sample_values: [['red', 'blue'], ['green']],
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
          probability: 1.0,
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
                  probability: 1.0,
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
                          probability: 1.0,
                          types: [
                            {
                              name: 'String',
                              bsonType: 'String',
                              path: ['level1', 'level2', 'value'],
                              count: 1,
                              probability: 1.0,
                              values: ['deep'],
                            } as SchemaType,
                          ],
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
          probability: 1.0,
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
                      probability: 1.0,
                      types: [
                        {
                          name: 'Number',
                          bsonType: 'Number',
                          path: ['items', 'id'],
                          count: 2,
                          probability: 1.0,
                          values: [1, 2],
                        } as SchemaType,
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

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'items[].id': {
        type: 'Number',
        sample_values: [1, 2],
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
              values: [
                [
                  [
                    [1, 2],
                    [3, 4],
                  ],
                  [
                    [5, 6],
                    [7, 8],
                  ],
                ],
              ],
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
                  values: [
                    [
                      [1, 2],
                      [3, 4],
                    ],
                    [
                      [5, 6],
                      [7, 8],
                    ],
                  ],
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
                      values: [
                        [1, 2],
                        [3, 4],
                        [5, 6],
                        [7, 8],
                      ],
                      types: [
                        {
                          name: 'Number',
                          bsonType: 'Number',
                          path: ['cube'],
                          count: 8,
                          probability: 1.0,
                          values: [1, 2, 3, 4, 5, 6, 7, 8],
                        } as SchemaType,
                      ],
                    } as ArraySchemaType,
                  ],
                } as ArraySchemaType,
              ],
            } as ArraySchemaType,
          ],
        } as SchemaField,
      ],
      count: 1,
    };

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'cube[][][]': {
        type: 'Number',
        sample_values: [
          [
            [
              [1, 2],
              [3, 4],
            ],
            [
              [5, 6],
              [7, 8],
            ],
          ],
        ],
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
                              values: [1, 3],
                            } as SchemaType,
                          ],
                        } as SchemaField,
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
                              values: [2, 4],
                            } as SchemaType,
                          ],
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
              values: [
                [
                  { name: 'Team A', members: ['Alice', 'Bob'] },
                  { name: 'Team B', members: ['Charlie'] },
                ],
              ],
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
                        } as SchemaType,
                      ],
                    } as SchemaField,
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
                          values: [['Alice', 'Bob'], ['Charlie']],
                          types: [
                            {
                              name: 'String',
                              bsonType: 'String',
                              path: ['teams', 'members'],
                              count: 3,
                              probability: 1.0,
                              values: ['Alice', 'Bob', 'Charlie'],
                            } as SchemaType,
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

    const result = processSchema(schema);

    expect(result).to.deep.equal({
      'teams[].name': {
        type: 'String',
        sample_values: ['Team A', 'Team B'],
        probability: 1.0,
      },
      'teams[].members[]': {
        type: 'String',
        sample_values: [['Alice', 'Bob'], ['Charlie']],
        probability: 1.0,
      },
    });
  });
});
