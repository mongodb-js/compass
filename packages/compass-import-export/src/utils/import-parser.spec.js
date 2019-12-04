import fs from 'fs';
import path from 'path';
import stream from 'stream';

import createParser from './import-parser';

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

function runParser(src, parser) {
  const docs = [];
  const source = fs.createReadStream(src);
  const dest = new stream.Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      docs.push(chunk);
      callback(null, chunk);
    }
  });
  return new Promise(function(resolve, reject) {
    stream.pipeline(source, parser, dest, function(err, res) {
      if (err) {
        return reject(err);
      }
      resolve(docs, res);
    });
  });
}

describe('import-parser', () => {
  describe('json', () => {
    it('should parse a file', () => {
      return runParser(FIXTURES.GOOD_JSON, createParser()).then((docs) => {
        expect(docs).to.have.length(3);
      });
    });
    it('should parse a line-delimited file', () => {
      return runParser(
        FIXTURES.LINE_DELIMITED_JSON,
        createParser({ fileType: 'json', isMultilineJSON: true })
      ).then((docs) => expect(docs).to.have.length(3));
    });
    it('should parse a line-delimited file with an extra empty line', () => {
      return runParser(
        FIXTURES.LINE_DELIMITED_JSON_EXTRA_LINE,
        createParser({ isMultilineJSON: true })
      ).then((docs) => expect(docs).to.have.length(3));
    });
    describe('deserialize', () => {
      const BSON_DOCS = [];
      before(() => {
        const src = FIXTURES.GOOD_JSON;
        return runParser(src, createParser()).then(function(docs) {
          BSON_DOCS.push.apply(BSON_DOCS, docs);
        });
      });
      it('should have bson ObjectId for _id', () => {
        expect(BSON_DOCS[0]._id._bsontype).to.equal('ObjectID');
      });
    });
    describe('errors', () => {
      let parseError;
      before((done) => {
        const p = runParser(FIXTURES.JS_I_THINK_IS_JSON, createParser());
        p.catch((err) => (parseError = err));
        expect(p).to.be.rejected.and.notify(done);
      });
      it('should catch errors by default', () => {
        expect(parseError.name).to.equal('JSONError');
      });
      it('should have a human readable error message', () => {
        const DEFAULT_MESSAGE =
          'Error: Invalid JSON (Unexpected "_" at position 10 in state STOP)';
        expect(parseError.message).to.not.contain(DEFAULT_MESSAGE);
      });
    });
  });
  describe('csv', () => {
    it('should work', () => {
      return runParser(
        FIXTURES.GOOD_CSV,
        createParser({ fileType: 'csv' })
      ).then((docs) => {
        expect(docs).to.have.length(3);
      });
    });
    /**
     * TODO: lucas: Revisit and unskip if we really want csv to be strict.
     */
    describe.skip('errors', () => {
      let parseError;
      before((done) => {
        const p = runParser(
          FIXTURES.BAD_CSV,
          createParser({ fileType: 'csv', delimiter: '\n' })
        );
        p.catch((err) => (parseError = err));
        expect(p).to.be.rejected.and.notify(done);
      });

      it('should catch errors by default', () => {
        expect(parseError).to.be.an('error');
      });
      it('should have a human readable error message', () => {
        expect(parseError.message).to.equal(
          'Row length does not match headers'
        );
      });
    });
  });
});
