import { expect } from 'chai';

// Needs to be executed before importing plugin
import { cleanUp } from './test/setup';

import * as CompassPlugin from './index';

describe('Compass Plugin', function () {
  after(function () {
    cleanUp();
  });
  it('exports activate, deactivate, and metadata', function () {
    expect(CompassPlugin).to.have.property('activate');
    expect(CompassPlugin).to.have.property('deactivate');
    expect(CompassPlugin).to.have.property('metadata');
  });
});
