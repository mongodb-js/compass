import detectImportFile from './detect-import-file';
import { expect } from 'chai';
import { FIXTURES } from '../../test/fixtures';

describe('detectImportFile', function () {
  it('should detect a JSON array', function (done) {
    detectImportFile(FIXTURES.JSON_ARRAY, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.false;
      done();
    });
    expect(true).to.equal(true);
  });
  it('should detect new line delimited JSON', function (done) {
    detectImportFile(FIXTURES.NDJSON, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
  it('should detect new line delimited JSON even with an empty last line', function (done) {
    detectImportFile(FIXTURES.NDJSON_EXTRA_LINE, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
  it('should detect with a preference toward peek NOT just file extension', function (done) {
    detectImportFile(FIXTURES.JSON_WITH_CSV_FILEEXT, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
});
