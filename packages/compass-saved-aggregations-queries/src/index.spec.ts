// import path from 'path';
// import os from 'os';
// import fs from 'fs';
import { expect } from 'chai';
import * as CompassPlugin from './index';

// const initialStorageMixinTestValue = process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH;

describe('Compass Plugin', function () {
  // let CompassPlugin;
  // beforeEach(async function () {
    // // todo: evaluate
    // this.timeout(30000);
    // const tmpDir = fs.mkdtempSync(
    //   path.join(os.tmpdir(), 'saved-aggregations-queries-test')
    // );
    // process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH = tmpDir;
    // CompassPlugin = await import('./index');
  // });

  // afterEach(function () {
  //   process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH = initialStorageMixinTestValue;
  //   console.log(`AfterEach Timeout: ${this.timeout()}`);
  // });

  it('exports activate, deactivate, and metadata', function () {
    expect(CompassPlugin).to.have.property('activate');
    expect(CompassPlugin).to.have.property('deactivate');
    expect(CompassPlugin).to.have.property('metadata');
  });
});
