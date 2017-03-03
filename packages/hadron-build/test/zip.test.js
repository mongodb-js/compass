const zip = require('../lib/zip');
const getTarget = require('./helpers').getConfig;
const chai = require('chai');
const expect = chai.expect;

describe('zip', function() {
  it('should return the correct root path to zip', function() {
    const targets = {
      linux: getTarget({
        version: '1.2.0',
        platform: 'linux'
      }),
      win32: getTarget({
        version: '1.2.0',
        platform: 'win32'
      }),
      darwin: getTarget({
        version: '1.2.0',
        platform: 'darwin'
      })
    };

    const options = {
      linux: zip.getOptions(targets.linux),
      win32: zip.getOptions(targets.win32),
      darwin: zip.getOptions(targets.darwin)
    };

    expect(options.linux).to.equal(null);

    expect(options.darwin).to.be.a('object');

    expect(options.win32).to.be.a('object');
  });
});
