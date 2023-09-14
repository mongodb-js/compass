import type { Writable } from 'stream';
import { expect } from 'chai';

import { createCollectionWriteStream } from './collection-stream';

const BATCH_SIZE = 1000;

function getDataService({
  isFLE,
  throwErrors,
}: {
  isFLE: boolean;
  throwErrors: boolean;
}) {
  return {
    bulkWrite: (ns: string, docs: any[] /*, options: any*/) => {
      return new Promise((resolve, reject) => {
        if (isFLE && docs.length !== 1) {
          const error: any = new Error(
            'Only single insert batches are supported in FLE2'
          );
          error.code = 6371202;
          return reject(error);
        }

        if (throwErrors) {
          const error = new Error('fake bulkWrite error');
          delete error.stack; // slows down tests due to excess output
          return reject(error);
        }

        resolve({
          insertedCount: docs.length,
          matchedCount: 0,
          modifiedCount: 0,
          deletedCount: 0,
          upsertedCount: 0,
          ok: 1,
        });
      });
    },

    insertOne: () => {
      if (throwErrors) {
        const error = new Error('fake insertOne error');
        delete error.stack; // slows down tests due to excess output
        return Promise.reject(error);
      }

      return Promise.resolve({ acknowledged: true });
    },
  };
}

async function insertDocs(dest: Writable, docs: any) {
  try {
    for (const doc of docs) {
      await new Promise<void>((resolve, reject) => {
        dest.write(doc, (err) => (err ? reject(err) : resolve()));
      });
    }

    return new Promise<void>((resolve, reject) => {
      dest.end((err?: Error) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    // we'll get here if stopOnErrors is true, because dest.write will throw
    // ignore this for now (and stop writing more). we'll detect it via the
    // stream's error event in the tests
  }
}

function getExpectedNumBatches(
  numDocs: number,
  isFLE: boolean,
  stopOnErrors: boolean
) {
  if (stopOnErrors) {
    return 1;
  }

  if (isFLE) {
    // one attempted batch at the batch size (followed by insertOne() on retry), then subsequent batches are all size 1.
    return numDocs > BATCH_SIZE ? 1 + numDocs - BATCH_SIZE : 1;
  }

  return Math.ceil(numDocs / BATCH_SIZE);
}

function getExpectedDocsInBatch(
  batchNum: number,
  numDocs: number,
  isFLE: boolean
) {
  if (batchNum === 1) {
    return Math.min(numDocs, BATCH_SIZE);
  }

  if (isFLE && batchNum > 1) {
    return 1;
  }

  const numBatches = getExpectedNumBatches(numDocs, isFLE, false);

  return batchNum < numBatches
    ? BATCH_SIZE
    : numDocs - (batchNum - 1) * BATCH_SIZE;
}

describe('collection-stream', function () {
  const docs: { i: number }[] = [];
  for (let i = 0; i < BATCH_SIZE * 2 + 1; ++i) {
    docs.push({ i });
  }

  for (const isFLE of [true, false]) {
    it(`inserts documents ${isFLE ? 'one by one' : 'in batches'} to ${
      isFLE ? 'FLE2' : 'regular'
    } collection`, async function () {
      const numBatches = getExpectedNumBatches(docs.length, isFLE, false);

      const dataService = getDataService({ isFLE, throwErrors: false });

      const dest = createCollectionWriteStream(
        dataService as any,
        'db.col',
        false
      );

      let resolveWrite: () => void;
      const writePromise = new Promise<void>((resolve) => {
        resolveWrite = resolve;
      });

      let batchNum = 0;
      let totalDocs = 0;
      dest.on('progress', (progressStats) => {
        batchNum++;
        const docsInBatch = getExpectedDocsInBatch(
          batchNum,
          docs.length,
          isFLE
        );
        totalDocs += docsInBatch;
        expect(progressStats).to.deep.equal({
          docsProcessed: totalDocs,
          docsWritten: totalDocs,
          errors: [],
        });

        const streamStats = dest.getStats();
        if (streamStats.insertedCount === docs.length) {
          resolveWrite();
        }
      });

      await insertDocs(dest, docs);

      await writePromise;

      const stats = dest.getStats();

      expect(stats).to.deep.equal({
        ok: numBatches,
        insertedCount: docs.length,
        matchedCount: 0,
        modifiedCount: 0,
        deletedCount: 0,
        upsertedCount: 0,
        writeErrors: [],
        writeConcernErrors: [],
      });
    });

    for (const stopOnErrors of [true, false]) {
      it(`${stopOnErrors ? 'stops' : 'does not stop'} on the first error for ${
        isFLE ? 'FLE2' : 'regular'
      } collection if stopOnErrors is ${stopOnErrors}`, async function () {
        const numBatches = getExpectedNumBatches(docs.length, isFLE, true);

        const dataService = getDataService({ isFLE, throwErrors: true });

        const dest = createCollectionWriteStream(
          dataService as any,
          'db.col',
          stopOnErrors
        );

        let resolveWrite: () => void;
        const writePromise = new Promise<void>((resolve) => {
          resolveWrite = resolve;
        });

        let batchNum = 0;
        let totalDocs = 0;
        const errors: Error[] = [];

        let rejectError: (err: Error) => void;
        const errorPromise = new Promise<void>((resolve, reject) => {
          rejectError = reject;
        });

        dest.on('error', (err) => {
          // we'll only get here if stopOnErrors is true
          rejectError(err);
        });

        dest.on('progress', (progressStats) => {
          batchNum++;
          if (batchNum > 1) {
            // we should never have made it to the second batch if stopOnErrors is true
            expect(stopOnErrors).to.equal(false);
          }
          const docsInBatch = getExpectedDocsInBatch(
            batchNum,
            docs.length,
            isFLE
          );
          totalDocs += docsInBatch;

          if (isFLE && batchNum === 1) {
            const errorsInBatch = stopOnErrors ? 1 : docsInBatch;
            for (let i = 0; i < errorsInBatch; ++i) {
              errors.push(new Error('fake insertOne error'));
            }
          } else {
            errors.push(new Error('fake bulkWrite error'));
          }

          // comparing errors is weird
          for (let i = 0; i < errors.length; ++i) {
            expect(progressStats.errors[i].message).to.equal(errors[i].message);
          }
          expect(progressStats.errors.length).to.equal(errors.length);
          delete progressStats.errors;

          expect(progressStats).to.deep.equal({
            docsProcessed: totalDocs,
            docsWritten: 0,
          });

          if (batchNum === numBatches) {
            resolveWrite();
          }
        });

        await insertDocs(dest, docs);

        await writePromise;

        if (stopOnErrors) {
          await expect(errorPromise).to.be.rejectedWith(
            Error,
            isFLE ? 'fake insertOne error' : 'fake bulkWrite error'
          );
        }

        const stats = dest.getStats();

        expect(stats).to.deep.equal({
          ok: isFLE ? 1 : 0, // wat?
          insertedCount: 0,
          matchedCount: 0,
          modifiedCount: 0,
          deletedCount: 0,
          upsertedCount: 0,
          // all the errors are on dest._errors, so only on the progress stats, not on the stream stats
          writeErrors: [],
          writeConcernErrors: [],
        });
      });
    }
  }
});
