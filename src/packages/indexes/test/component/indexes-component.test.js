'use strict';

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');
const IndexesComponent = require('../../lib/component/indexes-component');
const helpers = require('../../../../../test/helpers');

describe('IndexesComponent', function() {

  before(function(done) {
    helpers.setupApplicationStore(done);
  });

  after(function(done) {
    helpers.tearDownApplicationStore(done);
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
