import { expect } from 'chai';
import * as CompassPlugin from './index';

describe('Compass Plugin', function () {
  it('exports activate, deactivate, and metadata', function () {
    expect(CompassPlugin).to.have.property('activate');
    expect(CompassPlugin).to.have.property('deactivate');
    expect(CompassPlugin).to.have.property('metadata');
  });
});
