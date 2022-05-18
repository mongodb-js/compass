import { createCollectionWriteStream } from './collection-stream';
const { expect } = require('chai');

const TEST_COLLECTION_NAME = 'db.testimport';

const runImport = (dataService, stopOnErrors) => {
  return new Promise((resolve, reject) => {
    try {
      const dest = createCollectionWriteStream(
        dataService,
        TEST_COLLECTION_NAME,
        stopOnErrors
      );

      dest.once('progress', (stats) => {
        resolve(stats);
      });

      dest.write({ phoneNumber: '+12874627836' });
      dest.write({ phoneNumber: '+12874627811' });
      dest.end({ phoneNumber: '+12874627222' });
    } catch (err) {
      reject(err);
    }
  });
};

describe('collection-stream', function () {
  describe('_executeBatch', function () {
    it('insert documents as bulk to regular collection', async function () {
      const dataService = {
        _collection: function () {
          return {
            bulkWrite: () =>
              Promise.resolve({
                nInserted: 3,
                nMatched: 0,
                nModified: 0,
                nRemoved: 0,
                nUpserted: 0,
                ok: 1,
              }),
          };
        },
      };

      const stats = await runImport(dataService, false);

      expect(stats.docsProcessed).to.be.equal(3);
      expect(stats.docsWritten).to.be.equal(3);
      expect(stats.errors.length).to.be.equal(0);
    });

    it('insert documents one by one to FLE2 collection', async function () {
      const dataService = {
        _collection: function () {
          return {
            bulkWrite: () =>
              new Promise((resolve, reject) => {
                const error = new Error(
                  'Only single insert batches are supported in FLE2'
                );
                error.code = 6371202;

                reject(error);
              }),
            insertOne: () => Promise.resolve({ acknowledged: true }),
          };
        },
      };

      const stats = await runImport(dataService, false);

      expect(stats.docsProcessed).to.be.equal(3);
      expect(stats.docsWritten).to.be.equal(3);
      expect(stats.errors.length).to.be.equal(0);
    });

    it('insert documents to FLE2 collection even one is failed', async function () {
      let i = 0;
      const dataService = {
        _collection: function () {
          return {
            bulkWrite: () =>
              new Promise((resolve, reject) => {
                const error = new Error(
                  'Only single insert batches are supported in FLE2'
                );
                error.code = 6371202;

                reject(error);
              }),
            insertOne: () =>
              new Promise((resolve, reject) => {
                i += 1;

                if (i === 2) {
                  return reject(new Error('foo'));
                } else {
                  return resolve({ acknowledged: true });
                }
              }),
          };
        },
      };

      const stats = await runImport(dataService, false);

      expect(stats.docsProcessed).to.be.equal(3);
      expect(stats.docsWritten).to.be.equal(2);
      expect(stats.errors.length).to.be.equal(1);
    });

    it('stops on error when inserting to FLE2 collection', async function () {
      let i = 0;
      const dataService = {
        _collection: function () {
          return {
            bulkWrite: () =>
              new Promise((resolve, reject) => {
                const error = new Error(
                  'Only single insert batches are supported in FLE2'
                );
                error.code = 6371202;

                reject(error);
              }),
            insertOne: () =>
              new Promise((resolve, reject) => {
                i += 1;

                if (i === 2) {
                  return reject(new Error('foo'));
                } else {
                  return resolve({ acknowledged: true });
                }
              }),
          };
        },
      };

      const stats = await runImport(dataService, true);

      expect(stats.docsProcessed).to.be.equal(3);
      expect(stats.docsWritten).to.be.equal(1);
      expect(stats.errors.length).to.be.equal(1);
    });
  });
});
