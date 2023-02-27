import sinon from 'sinon';
import bson from 'bson';
import { expect } from 'chai';

import { analyzeSchema } from './schema-analysis';

describe('schema-analyis', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('getResult', function () {
    it('returns the schema', async function () {
      const dataService = {
        sample: () =>
          Promise.resolve([
            { x: 1 },
            { y: 2, __safeContent__: [new bson.Binary('aaaa')] },
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
            path: 'x',
            count: 1,
            types: [
              {
                name: 'Number',
                bsonType: 'Number',
                path: 'x',
                count: 1,
                values: [1],
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
              {
                name: 'Undefined',
                type: 'Undefined',
                path: 'x',
                count: 1,
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
            ],
            total_count: 2,
            type: ['Number', 'Undefined'],
            has_duplicates: false,
            probability: 0.5,
          },
          {
            name: 'y',
            path: 'y',
            count: 1,
            types: [
              {
                name: 'Number',
                bsonType: 'Number',
                path: 'y',
                count: 1,
                values: [2],
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
              {
                name: 'Undefined',
                type: 'Undefined',
                path: 'y',
                count: 1,
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
            ],
            total_count: 2,
            type: ['Number', 'Undefined'],
            has_duplicates: false,
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
});
