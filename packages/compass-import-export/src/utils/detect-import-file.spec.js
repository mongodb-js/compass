import detectImportFile from './detect-import-file';
import { expect } from 'chai';
import { fixtures } from '../../test/fixtures';

describe('detectImportFile', function () {
  it('should detect a JSON array', function (done) {
    detectImportFile(fixtures.json.good, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.false;
      done();
    });
    expect(true).to.equal(true);
  });
  it('should detect new line delimited JSON', function (done) {
    detectImportFile(fixtures.jsonl.good, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
  it('should detect new line delimited JSON even with an empty last line', function (done) {
    detectImportFile(fixtures.jsonl.extra_line, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
  it('should detect with a preference toward peek NOT just file extension', function (done) {
    detectImportFile(fixtures.json.json_with_csv_fileext, function (err, res) {
      if (err) return done(err);
      expect(res.fileType).to.equal('json');
      expect(res.fileIsMultilineJSON).to.be.true;
      done();
    });
  });
});
