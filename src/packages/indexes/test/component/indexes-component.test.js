'use strict';

const StoreSupport = require('mongodb-test-utils').StoreSupport;
const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');
const IndexesComponent = require('../../lib/component/indexes-component');
const Connection = require('mongodb-connection-model');

const DATABASE = 'compass-test';
const COLLECTION = 'bands';
const CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: DATABASE });

describe('IndexesComponent', function() {

  before(function(done) {
    StoreSupport.setup(DATABASE, COLLECTION, CONNECTION, done);
  });

  after(function(done) {
    StoreSupport.teardown(done);
  });

  describe('#render', function() {
    var output = null;

    before(function() {
      var renderer = ReactTestUtils.createRenderer();
      renderer.render(React.createElement(IndexesComponent));
      output = renderer.getRenderOutput();
    });

    it('returns the indexes component div', function() {
      expect(output.type).to.equal('div');
    });
  });
});
