import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { createProxyquireMockForQueriesAndAggregationsPlugins } from '../test/mock';

const CompassPlugin: any = proxyquire.load(
  './index',
  createProxyquireMockForQueriesAndAggregationsPlugins([], [])
);

describe('Compass Plugin', function () {
  it('exports activate, deactivate, and metadata', function () {
    expect(CompassPlugin).to.have.property('activate');
    expect(CompassPlugin).to.have.property('deactivate');
    expect(CompassPlugin).to.have.property('metadata');
  });
});
