import fs from 'fs';
import path from 'path';
import stream from 'stream';

import { createCSVParser, createJSONParser } from './parsers';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'test');
const FIXTURES = {
  GOOD_CSV: path.join(TEST_DIR, 'good.csv'),
  BAD_CSV: path.join(TEST_DIR, 'bad.csv'),
  JS_I_THINK_IS_JSON: path.join(TEST_DIR, 'js-i-think-is.json'),
  GOOD_JSON: path.join(TEST_DIR, 'docs.json'),
  LINE_DELIMITED_JSON: path.join(TEST_DIR, 'docs.jsonl'),
  LINE_DELIMITED_JSON_EXTRA_LINE: path.join(
    TEST_DIR,
    'docs-with-newline-ending.jsonl'
  )
};
function runParser(file, parser) {
  const docs = [];
  const source = fs.createReadStream(file);
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

describe('parsers', () => {
  describe('json', () => {
    it('should parse a file', () => {
      return runParser(FIXTURES.GOOD_JSON, createJSONParser()).then(docs => {
        expect(docs).to.have.length(3);
      });
    });
    it('should parse a line-delimited file', () => {
      return runParser(
        FIXTURES.LINE_DELIMITED_JSON,
        createJSONParser({ selector: null })
      ).then(docs => {
        expect(docs).to.have.length(3);
      });
    });
    it('should parse a line-delimited file with an extra empty line', () => {
      return runParser(
        FIXTURES.LINE_DELIMITED_JSON_EXTRA_LINE,
        createJSONParser({ selector: null })
      ).then(docs => {
        expect(docs).to.have.length(3);
      });
    });
    describe('deserialize', () => {
      const DOCS = [];
      before(() => {
        const src = FIXTURES.GOOD_JSON;
        return runParser(src, createJSONParser({ fileName: src })).then(
          docs => {
            DOCS.push.apply(DOCS, docs);
          }
        );
      });
      it('should have bson ObjectId', () => {
        expect(DOCS[0]._id._bsontype).to.equal('ObjectID');
      });
    });
    describe('errors', () => {
      let parseError;

      before(done => {
        const src = FIXTURES.JS_I_THINK_IS_JSON;
        const p = runParser(src, createJSONParser({ fileName: src }));
        p.catch(err => (parseError = err));
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
      return runParser(FIXTURES.GOOD_CSV, createCSVParser()).then(docs => {
        expect(docs).to.have.length(3);
      });
    });
    describe('errors', () => {
      let parseError;
      before(done => {
        const src = FIXTURES.BAD_CSV;
        const p = runParser(src, createCSVParser());
        p.catch(err => (parseError = err));
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
