import { createJSONFormatter } from './formatters';
import stream from 'stream';
import bson, { EJSON } from 'bson';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { EOL } from 'os';

const pipeline = promisify(stream.pipeline);
const readFile = promisify(fs.readFile);

const rm = function(src) {
  return new Promise((resolve) => {
    fs.unlink(src, function() {
      resolve(true);
    });
  });
};

const BASE_FIXTURE_PATH = path.join(__dirname, '..', '..', '..', 'test');
const FIXTURES = {
  JSON_SINGLE_DOC: path.join(BASE_FIXTURE_PATH, 'export-single-doc.json'),
  JSON_MULTI_SMALL_DOCS: path.join(BASE_FIXTURE_PATH, 'export-multi-small-docs.json'),
  JSONL: path.join(BASE_FIXTURE_PATH, 'export-two-docs.jsonl'),
};

describe('formatters', () => {
  describe('json', () => {
    it('should format a single docment in an array', () => {
      const source = stream.Readable.from([{_id: new bson.ObjectId('5e5ea7558d35931a05eafec0')}]);
      const formatter = createJSONFormatter({brackets: true});
      const dest = fs.createWriteStream(FIXTURES.JSON_SINGLE_DOC);

      return pipeline(source, formatter, dest)
        .then(() => readFile(FIXTURES.JSON_SINGLE_DOC))
        .then((contents) => {
          const parsed = EJSON.parse(contents);
          expect(parsed).to.deep.equal([{_id: new bson.ObjectId('5e5ea7558d35931a05eafec0')}]);
        })
        .then(() => rm(FIXTURES.JSON_SINGLE_DOC));
    });
    it('should format more than 2 docments in an array', () => {
      const docs = [
        {_id: new bson.ObjectId('5e5ea7558d35931a05eafec0')},
        {_id: new bson.ObjectId('5e6bafc438e060f695591713')},
        {_id: new bson.ObjectId('5e6facaa9777ff687c946d6c')}
      ];
      const source = stream.Readable.from(docs);
      const formatter = createJSONFormatter({brackets: true});
      const dest = fs.createWriteStream(FIXTURES.JSON_MULTI_SMALL_DOCS);

      return pipeline(source, formatter, dest)
        .then(() => readFile(FIXTURES.JSON_MULTI_SMALL_DOCS))
        .then((contents) => {
          const parsed = EJSON.parse(contents);
          expect(parsed).to.deep.equal(docs);
        })
        .then(() => rm(FIXTURES.JSON_MULTI_SMALL_DOCS));
    });
  });
  describe('jsonl', () => {
    it('should support newline delimited ejson', () => {
      const docs = [
        {_id: new bson.ObjectId('5e5ea7558d35931a05eafec0')},
        {_id: new bson.ObjectId('5e6bafc438e060f695591713')},
        {_id: new bson.ObjectId('5e6facaa9777ff687c946d6c')}
      ];
      const source = stream.Readable.from(docs);
      const formatter = createJSONFormatter({brackets: false});
      const dest = fs.createWriteStream(FIXTURES.JSONL);

      return pipeline(source, formatter, dest)
        .then(() => readFile(FIXTURES.JSONL))
        .then((buf) => {
          const sources = buf.toString('utf-8').split(EOL);
          expect(EJSON.parse(sources[0])).to.deep.equal(docs[0]);
          expect(EJSON.parse(sources[1])).to.deep.equal(docs[1]);
          expect(EJSON.parse(sources[2])).to.deep.equal(docs[2]);
        })
        .then(() => rm(FIXTURES.JSONL));
    });
  });
});
