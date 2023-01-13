import { createJSONFormatter, createCSVFormatter } from './formatters';
import stream from 'stream';
import { EJSON, ObjectID, Binary, Long } from 'bson';
import { createCSVParser } from './import-parser';
import fs from 'fs';
import { promisify } from 'util';
import { EOL } from 'os';
import { expect } from 'chai';
import { FIXTURES } from '../../test/fixtures';

const pipeline = promisify(stream.pipeline);
const readFile = promisify(fs.readFile);

const rm = function (src) {
  return new Promise((resolve) => {
    fs.unlink(src, function () {
      resolve(true);
    });
  });
};

describe('formatters', function () {
  describe('json', function () {
    it('should format a single document in an array', function () {
      const source = stream.Readable.from([
        { _id: new ObjectID('5e5ea7558d35931a05eafec0') },
      ]);
      const formatter = createJSONFormatter({ brackets: true });
      const dest = fs.createWriteStream(FIXTURES.JSON_SINGLE_DOC);

      return pipeline(source, formatter, dest)
        .then(() => readFile(FIXTURES.JSON_SINGLE_DOC))
        .then((contents) => {
          const parsed = EJSON.parse(contents);
          expect(parsed).to.deep.equal([
            { _id: new ObjectID('5e5ea7558d35931a05eafec0') },
          ]);
        })
        .then(() => rm(FIXTURES.JSON_SINGLE_DOC));
    });
    it('should format more than 2 documents in an array', function () {
      const docs = [
        { _id: new ObjectID('5e5ea7558d35931a05eafec0') },
        { _id: new ObjectID('5e6bafc438e060f695591713') },
        { _id: new ObjectID('5e6facaa9777ff687c946d6c') },
      ];
      const source = stream.Readable.from(docs);
      const formatter = createJSONFormatter({ brackets: true });
      const dest = fs.createWriteStream(FIXTURES.JSON_MULTI_SMALL_DOCS);

      return pipeline(source, formatter, dest)
        .then(() => readFile(FIXTURES.JSON_MULTI_SMALL_DOCS))
        .then((contents) => {
          const parsed = EJSON.parse(contents);
          expect(parsed).to.deep.equal(docs);
        })
        .then(() => rm(FIXTURES.JSON_MULTI_SMALL_DOCS));
    });
    describe('should format binary data correctly', function () {
      afterEach(async function () {
        try {
          await rm(FIXTURES.JSON_MULTI_SMALL_DOCS);
        } catch (e) {
          // noop
        }
      });

      it('works for input with Binary data', async function () {
        const binary = new Binary(
          Buffer.from('56391cc226bc4affbe520f67856c09ec', 'hex'),
          4
        ).toUUID();

        const docs = [
          {
            _id: new ObjectID('5e5ea7558d35931a05eafec0'),
            test: binary,
          },
        ];
        const source = stream.Readable.from(docs);
        const formatter = createJSONFormatter({ brackets: true });
        const dest = fs.createWriteStream(FIXTURES.JSON_MULTI_SMALL_DOCS);

        await pipeline(source, formatter, dest);

        const contents = await readFile(FIXTURES.JSON_MULTI_SMALL_DOCS);
        const parsed = EJSON.parse(contents);

        expect(parsed).to.deep.equal(docs);
      });
    });
  });
  describe('should format Longs correctly', function () {
    afterEach(async function () {
      try {
        await rm(FIXTURES.JSON_MULTI_SMALL_DOCS);
      } catch (e) {
        // noop
      }
    });

    it('works for input with Long data', async function () {
      const long = Long.fromString('9007199254740993');

      const docs = [
        {
          _id: new ObjectID('5e5ea7558d35931a05eafec0'),
          test: long,
        },
      ];
      const source = stream.Readable.from(docs);
      const formatter = createJSONFormatter({ brackets: true });
      const dest = fs.createWriteStream(FIXTURES.JSON_MULTI_SMALL_DOCS);

      await pipeline(source, formatter, dest);

      const contents = await readFile(FIXTURES.JSON_MULTI_SMALL_DOCS);
      const parsed = EJSON.parse(contents, { relaxed: false });

      expect(parsed).to.deep.equal(docs);
    });
  });
  describe('jsonl', function () {
    it('should support newline delimited ejson', function () {
      const docs = [
        { _id: new ObjectID('5e5ea7558d35931a05eafec0') },
        { _id: new ObjectID('5e6bafc438e060f695591713') },
        { _id: new ObjectID('5e6facaa9777ff687c946d6c') },
      ];
      const source = stream.Readable.from(docs);
      const formatter = createJSONFormatter({ brackets: false });
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
  describe('csv', function () {
    /**
     * TODO: dedupe boilerplate between these tests.
     */
    it('should flatten nested documents as dotnotation headers', function () {
      const docs = [{ _id: { foo: 'bar' } }];
      const source = stream.Readable.from(docs);
      const formatter = createCSVFormatter({
        columns: ['_id.foo'],
      });
      const dest = fs.createWriteStream(FIXTURES.CSV_FLAT_HEADERS);

      return pipeline(source, formatter, dest)
        .then(() => readFile(FIXTURES.CSV_FLAT_HEADERS))
        .then(() => {
          return pipeline(
            fs.createReadStream(FIXTURES.CSV_FLAT_HEADERS),
            createCSVParser(),
            new stream.Writable({
              objectMode: true,
              write: function (chunk, encoding, callback) {
                expect(chunk).to.deep.equal({ '_id.foo': 'bar' });
                callback();
              },
            })
          );
        })
        .then(() => rm(FIXTURES.CSV_FLAT_HEADERS));
    });

    /**
     * TODO: figure out how make `flat` in dotnotation bson aware to fix this test.
     */
    it('should not flatten bson props as nested headers', function () {
      const docs = [{ _id: new ObjectID('5e5ea7558d35931a05eafec0') }];
      const source = stream.Readable.from(docs);
      const formatter = createCSVFormatter({ columns: ['_id'] });
      const dest = fs.createWriteStream(FIXTURES.CSV_FLAT_HEADERS);

      return pipeline(source, formatter, dest)
        .then(() => readFile(FIXTURES.CSV_FLAT_HEADERS))
        .then(() => {
          return pipeline(
            fs.createReadStream(FIXTURES.CSV_FLAT_HEADERS),
            createCSVParser(),
            new stream.Writable({
              objectMode: true,
              write: function (chunk, _encoding, callback) {
                expect(chunk).to.deep.equal({
                  _id: '5e5ea7558d35931a05eafec0',
                });
                callback();
              },
            })
          );
        })
        .then(() => rm(FIXTURES.CSV_FLAT_HEADERS));
    });
  });
});
