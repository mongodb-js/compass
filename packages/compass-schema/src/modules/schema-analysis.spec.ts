import sinon from 'sinon';
import bson from 'bson';
import { expect } from 'chai';
import mongoDBSchemaAnalyzeSchema from 'mongodb-schema';
import type { Schema } from 'mongodb-schema';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { isInternalFieldPath } from 'hadron-document';
import {
  createSandboxFromDefaultPreferences,
  type PreferencesAccess,
} from 'compass-preferences-model';

import { analyzeSchema, calculateSchemaMetadata } from './schema-analysis';

const testDocs = [
  {
    someFields: {
      pineapple: 25,
    },
    ok: 'nice',
  },
  {
    someFields: {
      someFields: {
        anArray: [
          {
            someFields: {
              someFields: {
                someFields: {
                  pineapple: 55,
                },
              },
            },
          },
        ],
      },
    },
    ok: 'nice',
  },
  {
    anArray: [
      {
        one: true,
      },
      {
        one: true,
      },
      {
        one: true,
      },
      {
        two: true,
      },
      {
        two: true,
      },
      {
        two: true,
      },
      'a',
      'b',
      'c',
      true,
      false,
      false,
    ],
  },
];

const dummyLogger = createNoopLogger('TEST');
let preferences: PreferencesAccess;

describe('schema-analysis', function () {
  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#getResult', function () {
    it('returns the schema', async function () {
      const docs = [
        { x: 1 },
        { y: 2, __safeContent__: [bson.Binary.createFromBase64('aaaa')] },
      ];
      const dataService = {
        sampleCursor: () =>
          ({
            async *[Symbol.asyncIterator]() {
              await new Promise((resolve) => setTimeout(resolve, 0));
              yield* docs;
            },
          } as any),
      };
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const schema = await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {},
        dummyLogger,
        preferences
      );

      const expectedSchema = {
        fields: [
          {
            name: 'x',
            path: ['x'],
            count: 1,
            types: [
              {
                name: 'Number',
                bsonType: 'Number',
                path: ['x'],
                count: 1,
                values: [1],
                probability: 0.5,
                unique: 1,
                hasDuplicates: false,
              },
              {
                name: 'Undefined',
                bsonType: 'Undefined',
                path: ['x'],
                count: 1,
                probability: 0.5,
                unique: 1,
                hasDuplicates: false,
              },
            ],
            type: ['Number', 'Undefined'],
            hasDuplicates: false,
            probability: 0.5,
          },
          {
            name: 'y',
            path: ['y'],
            count: 1,
            types: [
              {
                name: 'Number',
                bsonType: 'Number',
                path: ['y'],
                count: 1,
                values: [2],
                probability: 0.5,
                unique: 1,
                hasDuplicates: false,
              },
              {
                name: 'Undefined',
                bsonType: 'Undefined',
                path: ['y'],
                count: 1,
                probability: 0.5,
                unique: 1,
                hasDuplicates: false,
              },
            ],
            type: ['Number', 'Undefined'],
            hasDuplicates: false,
            probability: 0.5,
          },
        ],
        count: 2,
      };

      if (!schema) {
        throw new Error('schema is nul');
      }
      const internalSchema = await schema.getInternalSchema();
      internalSchema.fields = internalSchema.fields.filter(
        ({ path }) => !isInternalFieldPath(path[0])
      );

      expect(internalSchema).to.deep.equal(expectedSchema);
    });

    it('adds promoteValues: false so the analyzer can report more accurate types', async function () {
      const dataService = {
        sampleCursor: () =>
          ({
            async *[Symbol.asyncIterator]() {
              await new Promise((resolve) => setTimeout(resolve, 0));
              yield {
                a: 123,
              };
            },
          } as any),
      };
      const sampleSpy = sinon.spy(dataService, 'sampleCursor');
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {},
        dummyLogger,
        preferences
      );

      expect(sampleSpy).to.have.been.calledWith(
        'db.coll',
        {},
        { signal: abortSignal, promoteValues: false },
        { fallbackReadPreference: 'secondaryPreferred' }
      );
    });

    it('returns undefined if is cancelled', async function () {
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const dataService = {
        sampleCursor: () =>
          ({
            async *[Symbol.asyncIterator]() {
              await new Promise((resolve) => setTimeout(resolve, 0));
              yield {
                a: 123,
              };
              abortController.abort();
              yield {
                a: 345,
              };
            },
          } as any),
      };

      const result = await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {},
        dummyLogger,
        preferences
      );

      expect(result).to.equal(undefined);
    });

    it('throws if sample throws', async function () {
      const error: Error & {
        code?: any;
      } = new Error('pineapple');
      error.name = 'MongoError';
      error.code = new bson.Int32(1000);

      const dataService = {
        sampleCursor: () =>
          ({
            async *[Symbol.asyncIterator]() {
              await new Promise((resolve) => setTimeout(resolve, 0));
              yield {};
              throw error;
            },
          } as any),
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      try {
        await analyzeSchema(
          dataService,
          abortSignal,
          'db.coll',
          {},
          {},
          dummyLogger,
          preferences
        );
      } catch (err: any) {
        expect(err.message).to.equal('pineapple');
        expect(err.code).to.equal(1000);
        return;
      }
      throw new Error('expected error to be thrown');
    });
  });

  describe('#calculateSchemaMetadata', function () {
    describe('schema_depth', function () {
      describe('with an empty schema', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([{}]);
        });

        it('has a depth of 0', async function () {
          const { schema_depth } = await calculateSchemaMetadata(schema);
          expect(schema_depth).to.equal(0);
        });
      });

      describe('with a basic schema', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            {
              someFields: {
                pineapple: 25,
              },
              ok: 'nice',
            },
          ]);
        });

        it('has a depth of 2', async function () {
          const { schema_depth } = await calculateSchemaMetadata(schema);
          expect(schema_depth).to.equal(2);
        });
      });

      describe('with complex schema with different document depths', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema(testDocs);
        });

        it('has the correct depth', async function () {
          const { schema_depth } = await calculateSchemaMetadata(schema);
          expect(schema_depth).to.equal(8);
        });
      });

      describe('with a basic array', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            {
              arrayField: [1, 2, 3],
            },
          ]);
        });

        it('has a depth of two', async function () {
          const { schema_depth } = await calculateSchemaMetadata(schema);
          expect(schema_depth).to.equal(2);
        });
      });

      describe('with nested arrays', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            {
              arrayField: [[[['a']]]],
            },
          ]);
        });

        it('has the correct depth', async function () {
          const { schema_depth } = await calculateSchemaMetadata(schema);
          expect(schema_depth).to.equal(5);
        });
      });
    });

    describe('geo_data', function () {
      describe('with an empty schema', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([{}]);
        });

        it('returns false', async function () {
          const { geo_data } = await calculateSchemaMetadata(schema);
          expect(geo_data).to.equal(false);
        });
      });

      describe('with a basic document without geo data', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            {
              fruits: {
                pineapple: 'yes',
                apples: ['golden', 'fiji'],
              },
            },
          ]);
        });

        it('does not detect geo data', async function () {
          const { geo_data } = await calculateSchemaMetadata(schema);
          expect(geo_data).to.equal(false);
        });
      });

      describe('with more complex documents without geo data', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema(testDocs);
        });

        it('does not detect geo data', async function () {
          const { geo_data } = await calculateSchemaMetadata(schema);
          expect(geo_data).to.equal(false);
        });
      });

      describe('with a basic document with Point geo data', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            {
              name: 'somewhere',
              location: {
                type: 'Point',
                coordinates: [-73.856077, 40.848447],
              },
            },
          ]);
        });

        it('detects geo data', async function () {
          const { geo_data } = await calculateSchemaMetadata(schema);
          expect(geo_data).to.equal(true);
        });
      });

      describe('with Polygon geo data', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [-73.856077, 40.848447],
                      [-72.856077, 41.848447],
                      [-73.856077, 41.848447],
                      [-72.856077, 40.848447],
                    ],
                  ],
                },
              },
            },
          ]);
        });

        it('detects geo data', async function () {
          const { geo_data } = await calculateSchemaMetadata(schema);
          expect(geo_data).to.equal(true);
        });
      });
    });

    describe('variable_type_count', function () {
      describe('with fields having multiple types', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { pineapple: 123 },
            { pineapple: 'string' },
            { pineapple: true },
            { singleType: 'onlyString' },
          ]);
        });

        it('counts fields with more than one type', async function () {
          const { variable_type_count } = await calculateSchemaMetadata(schema);
          expect(variable_type_count).to.equal(1);
        });
      });

      describe('with no fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([{}]);
        });

        it('returns zero', async function () {
          const { variable_type_count } = await calculateSchemaMetadata(schema);
          expect(variable_type_count).to.equal(0);
        });
      });

      describe('with all single-type fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { a: 1 },
            { a: 2, b: 2 },
            { a: 2, c: 3 },
          ]);
        });

        it('returns zero', async function () {
          const { variable_type_count } = await calculateSchemaMetadata(schema);
          expect(variable_type_count).to.equal(0);
        });
      });

      describe('with differing nested fields fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { required: { notAlwaysPresent: 'yes' } },
            { required: { notAlwaysPresent: 123456 } },
            { required: { sometimesHere: true } },
          ]);
        });

        it('returns does not count the optionals', async function () {
          const { variable_type_count } = await calculateSchemaMetadata(schema);
          expect(variable_type_count).to.equal(0);
        });
      });
    });

    describe('optional_field_count', function () {
      describe('with optional fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { pineapple: 'yes', optional: 123 },
            { pineapple: 'yes' },
            { pineapple: 'yes', optional: 'maybe' },
          ]);
        });

        it('counts fields missing from some documents', async function () {
          const { optional_field_count } = await calculateSchemaMetadata(
            schema
          );
          expect(optional_field_count).to.equal(1);
        });
      });

      describe('with no fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([{}]);
        });

        it('returns zero', async function () {
          const { optional_field_count } = await calculateSchemaMetadata(
            schema
          );
          expect(optional_field_count).to.equal(0);
        });
      });

      describe('with all required fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { required: 1 },
            { required: 2 },
            { required: 3 },
          ]);
        });

        it('returns zero', async function () {
          const { optional_field_count } = await calculateSchemaMetadata(
            schema
          );
          expect(optional_field_count).to.equal(0);
        });
      });

      describe('with differing nested fields fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { required: { notAlwaysPresent: true } },
            { required: { notAlwaysPresent: true } },
            { required: { sometimesHere: true } },
          ]);
        });

        it('returns does not count the optionals', async function () {
          const { optional_field_count } = await calculateSchemaMetadata(
            schema
          );
          expect(optional_field_count).to.equal(0);
        });
      });
    });

    describe('field_types', function () {
      describe('with mixed bson types', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { number: 42, value: true, string: 'test' },
            {
              number: 100,
              value: 'ok',
              anotherString: 'hello',
              yetAnotherString: 'blueberry',
            },
          ]);
        });

        it('correctly counts the bson types', async function () {
          const { field_types } = await calculateSchemaMetadata(schema);
          expect(field_types).to.deep.equal({
            Number: 1,
            Boolean: 1,
            String: 4,
          });
        });
      });

      describe('with no fields', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([{}]);
        });

        it('returns an empty object', async function () {
          const { field_types } = await calculateSchemaMetadata(schema);
          expect(field_types).to.deep.equal({});
        });
      });

      describe('with a type occurring multiple times', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            { pineapple: 1, secondPineapple: 2, singlePineapple: 3 },
            { pineapple: 1, secondPineapple: 2 },
            { pineapple: 2, secondPineapple: 2 },
          ]);
        });

        it('correctly counts a single type', async function () {
          const { field_types } = await calculateSchemaMetadata(schema);
          expect(field_types).to.deep.equal({
            Number: 3,
          });
        });
      });

      describe('with nested arrays and objects', function () {
        let schema: Schema;
        before(async function () {
          schema = await mongoDBSchemaAnalyzeSchema([
            {
              arrayField: [[[['a']]]],
            },
            {
              arrayField: [[[['a', 123]]]],
              objectField: {
                innerObject: {
                  pineapple: 'wahoo',
                  anotherNumberInObject: 55,
                },
                numberInObject: 42,
              },
            },
          ]);
        });

        it('correctly counts bson types', async function () {
          const { field_types } = await calculateSchemaMetadata(schema);
          expect(field_types).to.deep.equal({
            Document: 2,
            Array: 4,
            String: 2,
            Number: 3,
          });
        });
      });
    });
  });
});
