import createPreviewWritable, { createPeekStream } from './import-preview';
import { Readable, pipeline } from 'stream';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

const TEST_DIR = path.join(__dirname, '..', '..', 'test');

describe('import-preview', function() {
  describe('createPreviewWritable', function() {
    it('should work with docs < MAX_SIZE', function(done) {
      const dest = createPreviewWritable();
      const source = Readable.from([{ _id: 1 }]);

      pipeline(source, dest, (err) => {
        if (err) return done(err);

        expect(dest.docs.length).to.equal(1);
        done();
      });
    });

    it('should work with docs === MAX_SIZE', function(done) {
      const dest = createPreviewWritable({ MAX_SIZE: 2 });
      const source = Readable.from([{ _id: 1 }, { _id: 2 }]);

      pipeline(source, dest, (err) => {
        if (err) return done(err);

        expect(dest.docs.length).to.equal(2);
        done();
      });
    });

    it('should convert types for csv', function(done) {
      const dest = createPreviewWritable({ fileType: 'csv' });
      const source = Readable.from([{ _id: 1 }, { _id: 2 }]);

      pipeline(source, dest, (err) => {
        if (err) return done(err);

        expect(dest.fields.length).to.equal(1);
        expect(dest.fields[0].type).to.equal('Number');
        done();
      });
    });

    it('should not convert types for json', function(done) {
      const dest = createPreviewWritable({ fileType: 'json' });
      const source = Readable.from([{ _id: 1 }, { _id: 2 }]);

      pipeline(source, dest, (err) => {
        if (err) return done(err);

        expect(dest.fields.length).to.equal(1);
        expect(dest.fields[0].type).to.be.undefined;
        done();
      });
    });

    it('should stop when it has enough docs', function(done) {
      const dest = createPreviewWritable({ MAX_SIZE: 2 });
      const source = Readable.from([{ _id: 1 }, { _id: 2 }, { _id: 3 }]);

      pipeline(source, dest, (err) => {
        if (err) return done(err);

        expect(dest.docs.length).to.equal(2);
        done();
      });
    });
  });

  describe('func', function() {
    it('should return 2 docs for a csv containing 3 docs', function(done) {
      const src = fs.createReadStream(path.join(TEST_DIR, 'good-commas.csv'));
      const dest = createPreviewWritable({ MAX_SIZE: 2 });

      pipeline(src, createPeekStream('csv'), dest, () => {
        expect(dest.docs.length).to.equal(2);
        done();
      });
    });
  });
});
