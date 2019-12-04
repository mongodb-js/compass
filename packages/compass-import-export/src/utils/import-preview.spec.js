import createPreviewWritable, { createPeekStream } from './import-preview';
import { Readable, pipeline } from 'stream';

import fs from 'fs';
import path from 'path';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'test');
const FIXTURES = {
  GOOD_CSV: path.join(TEST_DIR, 'good.csv'),
  BAD_CSV: path.join(TEST_DIR, 'mongoimport', 'test_bad.csv'),
  JS_I_THINK_IS_JSON: path.join(TEST_DIR, 'js-i-think-is.json'),
  GOOD_JSON: path.join(TEST_DIR, 'docs.json'),
  LINE_DELIMITED_JSON: path.join(TEST_DIR, 'docs.jsonl'),
  LINE_DELIMITED_JSON_EXTRA_LINE: path.join(
    TEST_DIR,
    'docs-with-newline-ending.jsonl'
  )
};

describe.skip('import-preview', () => {
  describe('createPreviewWritable', () => {
    it('should work with docs < MAX_SIZE', (done) => {
      const dest = createPreviewWritable();
      const source = Readable.from([{ _id: 1 }]);
      pipeline(source, dest, function(err) {
        if (err) return done(err);

        expect(dest.docs.length).to.equal(1);
        done();
      });
    });

    it('should work with docs === MAX_SIZE', (done) => {
      const dest = createPreviewWritable({ MAX_SIZE: 2 });
      const source = Readable.from([{ _id: 1 }, { _id: 2 }]);
      pipeline(source, dest, function(err) {
        if (err) return done(err);

        expect(dest.docs.length).to.equal(2);
        done();
      });
    });

    it('should stop when it has enough docs', (done) => {
      const dest = createPreviewWritable({ MAX_SIZE: 2 });
      const source = Readable.from([{ _id: 1 }, { _id: 2 }, { _id: 3 }]);
      pipeline(source, dest, function(err) {
        if (err) return done(err);

        expect(dest.docs.length).to.equal(2);
        done();
      });
    });
  });
  describe('func', () => {
    it('should return 2 docs for a csv containing 3 docs', (done) => {
      const src = fs.createReadStream(FIXTURES.GOOD_CSV);
      const dest = createPreviewWritable({ MAX_SIZE: 2 });

      pipeline(src, createPeekStream('csv'), dest, function(peeker) {
        expect(dest.docs.length).to.equal(2);
        done();
      });
    });
  });
});
