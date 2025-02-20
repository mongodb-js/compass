import sinon from 'sinon';
import { expect } from 'chai';

import { ImportWriter } from './import-writer';

const BATCH_SIZE = 1000;

type FakeError = Error & {
  result: {
    getWriteErrors?: () => Error[];
  };
};

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
          (error as FakeError).result = {
            getWriteErrors: () => {
              const errors: Error[] = [];
              for (let i = 0; i < docs.length; ++i) {
                const writeError = new Error(`Fake error for doc ${i}`);
                delete writeError.stack;
                errors.push(writeError);
              }
              return errors;
            },
          };
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

describe('ImportWriter', function () {
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

      const bulkWriteSpy = sinon.spy(dataService, 'bulkWrite');
      const insertOneSpy = sinon.spy(dataService, 'insertOne');

      const writer = new ImportWriter(dataService as any, 'db.col', false);

      for (const doc of docs) {
        await writer.write(doc);
      }

      await writer.finish();

      expect(bulkWriteSpy.callCount).to.equal(numBatches);
      for (const [index, args] of bulkWriteSpy.args.entries()) {
        const [, _docs] = args;
        const expected = getExpectedDocsInBatch(index + 1, docs.length, isFLE);
        expect(_docs.length).to.equal(expected);
      }
      if (isFLE) {
        expect(insertOneSpy.callCount).to.equal(BATCH_SIZE);
      } else {
        expect(insertOneSpy.callCount).to.equal(0);
      }
    });

    for (const stopOnErrors of [true, false]) {
      it(`${stopOnErrors ? 'stops' : 'does not stop'} on the first error for ${
        isFLE ? 'FLE2' : 'regular'
      } collection if stopOnErrors is ${stopOnErrors}`, async function () {
        const dataService = getDataService({ isFLE, throwErrors: true });

        const bulkWriteSpy = sinon.spy(dataService, 'bulkWrite');
        const insertOneSpy = sinon.spy(dataService, 'insertOne');

        const writer = new ImportWriter(
          dataService as any,
          'db.col',
          stopOnErrors
        );

        // It always throws, it just depends if it finished the batch or not and
        // whether it threw the first database error itself or a wrapped error
        // that wraps all the errors in the batch
        try {
          for (const doc of docs) {
            await writer.write(doc);
          }

          await writer.finish();
        } catch (err: any) {
          if (stopOnErrors) {
            if (isFLE) {
              expect(err.message).to.equal('fake insertOne error');
              expect(bulkWriteSpy.callCount).to.equal(1);
              expect(insertOneSpy.callCount).to.equal(1);
              expect(writer.docsWritten).to.equal(0);
              expect(writer.docsProcessed).to.equal(1000);
              // stop after the first insertOne call
              expect(writer.docsErrored).to.equal(1);
            } else {
              expect(err.message).to.equal('fake bulkWrite error');
              expect(bulkWriteSpy.callCount).to.equal(1);
              expect(insertOneSpy.callCount).to.equal(0);
              expect(writer.docsWritten).to.equal(0);
              expect(writer.docsProcessed).to.equal(1000);
              // stop after the first bulkWrite call. in this case the whole
              // first batch failed which is why there are so many docsErrored
              // (see our mocks above)
              expect(writer.docsErrored).to.equal(1000);
            }
          } else {
            if (isFLE) {
              expect(err.message).to.equal(
                'Something went wrong while writing data to a collection'
              );
              expect(err.writeErrors).to.have.length(1000);
              expect(bulkWriteSpy.callCount).to.equal(1);
              expect(insertOneSpy.callCount).to.equal(1000);

              expect(writer.docsWritten).to.equal(0);
              expect(writer.docsProcessed).to.equal(1000);
              expect(writer.docsErrored).to.equal(1000);
            } else {
              expect(err.message).to.equal(
                'Something went wrong while writing data to a collection'
              );
              expect(err.writeErrors).to.have.length(1000);
              expect(bulkWriteSpy.callCount).to.equal(1);
              expect(insertOneSpy.callCount).to.equal(0);

              expect(writer.docsWritten).to.equal(0);
              expect(writer.docsProcessed).to.equal(1000);
              expect(writer.docsErrored).to.equal(1000);
            }
          }

          return;
        }

        expect.fail('expected to throw regardless');
      });
    }
  }
});
