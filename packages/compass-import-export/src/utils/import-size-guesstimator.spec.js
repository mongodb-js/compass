// https://jira.mongodb.org/browse/COMPASS-3015
// ~/Downloads/DOB_Permit_Issuance-000.csv
//
// 92,782,967 bytes 200,000 docs
// 92782967/200000
// 463.914835 bytes per doc

// Object Size estimator
// import-size-guesstimator.js?6e25:45 source.bytesRead 458752
// import-size-guesstimator.js?6e25:46 bytesPerDoc 458.752
// import-size-guesstimator.js?6e25:47 docs seen 1000
// import-size-guesstimator.js?6e25:48 est docs 202250.81743512835
import { createCSVParser } from './import-parser';
import createImportSizeGuesstimator from './import-size-guesstimator';
import { pipeline } from 'stream';

// TODO (lucas) Find proper fixture for this to check in.
describe.skip('guesstimator', () => {
  it('should guess', function(done) {
    this.timeout(5000);

    const FILE_SIZE = 92782967;
    const fs = require('fs');
    const source = fs.createReadStream(
      '/Users/lucas/Downloads/DOB_Permit_Issuance-000.csv'
    );
    const parser = createCSVParser();
    const guesstimator = createImportSizeGuesstimator(
      source,
      FILE_SIZE,
      (err) => {
        if (err) return done(err);
      }
    );

    pipeline(source, parser, guesstimator, (err) => {
      return done(err);
    });
  });
});
