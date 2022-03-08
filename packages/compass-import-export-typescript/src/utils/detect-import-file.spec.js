import detectImportFile from './detect-import-file';
import path from 'path';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'test');
const FIXTURES = {
  JSON_ARRAY: path.join(TEST_DIR, 'docs.json'),
  NDJSON: path.join(TEST_DIR, 'docs.jsonl'),
  NDJSON_EXTRA_LINE: path.join(TEST_DIR, 'docs-with-newline-ending.jsonl'),
  JSON_WITH_CSV_FILEEXT: path.join(TEST_DIR, 'json-with-a.csv')
};

describe('detectImportFile', () => {
  it('should detect a JSON array', done => {
    detectImportFile(FIXTURES.JSON_ARRAY, function(err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.false;
      done();
    });
    expect(true).to.equal(true);
  });
  it('should detect new line delimited JSON', done => {
    detectImportFile(FIXTURES.NDJSON, function(err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
  it('should detect new line delimited JSON even with an empty last line', done => {
    detectImportFile(FIXTURES.NDJSON_EXTRA_LINE, function(err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
  it('should detect with a preference toward peek NOT just file extension', done => {
    detectImportFile(FIXTURES.JSON_WITH_CSV_FILEEXT, function(err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
});
