import { createCollectionWriteStream } from './collection-stream';
const { expect } = require('chai');

const TEST_COLLECTION_NAME = 'db.testimport';

const runImport = (dataService) => {
  return new Promise((resolve, reject) => {
    try {
      const dest = createCollectionWriteStream(
        dataService,
        TEST_COLLECTION_NAME,
        true
      );

      dest.once('progress', (stats) => {
        resolve(stats);
      });

      dest.write({ phoneNumber: '+12874627836' });
      dest.end({ phoneNumber: '+12874627222' });
    } catch (err) {
      reject(err);
    }
  });
};

describe('collection-stream', function () {
  describe('_executeBatch', function () {
    it('insert documents as bulk to regular collections', async function () {
      const dataService = {
        _collection: function () {
          return {
            bulkWrite: (operations, options, callback) =>
              callback(null, {
                nInserted: 2,
                nMatched: 0,
                nModified: 0,
                nRemoved: 0,
                nUpserted: 0,
                ok: 1,
              }),
          };
        },
      };

      const stats = await runImport(dataService);

      expect(stats.docsProcessed).to.be.equal(2);
      expect(stats.docsWritten).to.be.equal(2);
      expect(stats.errors.length).to.be.equal(0);
    });

    it('insert documents one by one to FLE2 collections', async function () {
      const dataService = {
        _collection: function () {
          return {
            bulkWrite: (operations, options, callback) => {
              const error = new Error(
                'Only single insert batches are supported in FLE2'
              );
              error.code = 6371202;

              callback(error);
            },
            insertOne: (document, options, callback) =>
              callback(null, { acknowledged: true }),
          };
        },
      };

      const stats = await runImport(dataService);

      expect(stats.docsProcessed).to.be.equal(2);
      expect(stats.docsWritten).to.be.equal(2);
      expect(stats.errors.length).to.be.equal(0);
    });

    it('insert documents to FLE2 collections even one is failed', async function () {
      let i = 0;
      const dataService = {
        _collection: function () {
          return {
            bulkWrite: (operations, options, callback) => {
              const error = new Error(
                'Only single insert batches are supported in FLE2'
              );
              error.code = 6371202;

              callback(error);
            },
            insertOne: (document, options, callback) => {
              if (i === 0) {
                i += 1;
                return callback(null, { acknowledged: true });
              } else {
                return callback(new Error('foo'));
              }
            },
          };
        },
      };

      const stats = await runImport(dataService);

      expect(stats.docsProcessed).to.be.equal(2);
      expect(stats.docsWritten).to.be.equal(1);
      expect(stats.errors.length).to.be.equal(1);
    });
  });
});
