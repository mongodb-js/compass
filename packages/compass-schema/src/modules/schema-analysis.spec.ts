import sinon from 'sinon';
import bson from 'bson';
import { expect } from 'chai';
import mongoDBSchemaAnalyzeSchema from 'mongodb-schema';
import type { Schema } from 'mongodb-schema';

import {
  analyzeSchema,
  calculateSchemaDepth,
  schemaContainsGeoData,
} from './schema-analysis';

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

describe('schema-analysis', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('#getResult', function () {
    it('returns the schema', async function () {
      const dataService = {
        sample: () =>
          Promise.resolve([
            { x: 1 },
            { y: 2, __safeContent__: [bson.Binary.createFromBase64('aaaa')] },
          ]),
        isCancelError: () => false,
      };
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const schema = await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {}
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

      expect(schema).to.deep.equal(expectedSchema);
    });

    it('adds promoteValues: false so the analyzer can report more accurate types', async function () {
      const dataService = {
        sample: () => Promise.resolve([]),
        isCancelError: () => false,
      };
      const sampleSpy = sinon.spy(dataService, 'sample');
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      await analyzeSchema(dataService, abortSignal, 'db.coll', {}, {});

      expect(sampleSpy).to.have.been.calledWith(
        'db.coll',
        {},
        { promoteValues: false }
      );
    });

    it('returns null if is cancelled', async function () {
      const dataService = {
        sample: () => Promise.reject(new Error('test error')),
        isCancelError: () => true,
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const result = await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {}
      );

      expect(result).to.equal(null);
    });

    it('throws if sample throws', async function () {
      const error: Error & {
        code?: any;
      } = new Error('should have been thrown');
      error.name = 'MongoError';
      error.code = new bson.Int32(1000);

      const dataService = {
        sample: () => Promise.reject(error),
        isCancelError: () => false,
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      try {
        await analyzeSchema(dataService, abortSignal, 'db.coll', {}, {});
      } catch (err: any) {
        expect(err.message).to.equal('should have been thrown');
        expect(err.code).to.equal(1000);
        return;
      }
      throw new Error('expected error to be thrown');
    });
  });

  describe('#calculateSchemaDepth', function () {
    describe('with an empty schema', function () {
      let schema: Schema;
      before(async function () {
        schema = await mongoDBSchemaAnalyzeSchema([{}]);
      });

      it('has a depth of 0', function () {
        expect(calculateSchemaDepth(schema)).to.equal(0);
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

      it('has a depth of 2', function () {
        expect(calculateSchemaDepth(schema)).to.equal(2);
      });
    });

    describe('with complex schema with different document depths', function () {
      let schema: Schema;
      before(async function () {
        schema = await mongoDBSchemaAnalyzeSchema(testDocs);
      });

      it('has the correct depth', function () {
        expect(calculateSchemaDepth(schema)).to.equal(8);
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

      it('has a depth of two', function () {
        expect(calculateSchemaDepth(schema)).to.equal(2);
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

      it('has the correct depth', function () {
        expect(calculateSchemaDepth(schema)).to.equal(5);
      });
    });
  });

  describe('#schemaContainsGeoData', function () {
    describe('with an empty schema', function () {
      let schema: Schema;
      before(async function () {
        schema = await mongoDBSchemaAnalyzeSchema([{}]);
      });

      it('returns false', function () {
        expect(schemaContainsGeoData(schema)).to.equal(false);
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

      it('does not detect geo data', function () {
        expect(schemaContainsGeoData(schema)).to.equal(false);
      });
    });

    describe('with more complex documents without geo data', function () {
      let schema: Schema;
      before(async function () {
        schema = await mongoDBSchemaAnalyzeSchema(testDocs);
      });

      it('does not detect geo data', function () {
        expect(schemaContainsGeoData(schema)).to.equal(false);
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

      it('detects geo data', function () {
        expect(schemaContainsGeoData(schema)).to.equal(true);
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

      it('detects geo data', function () {
        expect(schemaContainsGeoData(schema)).to.equal(true);
      });
    });
  });
});
