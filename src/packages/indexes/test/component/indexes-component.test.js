'use strict';

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');
const IndexesComponent = require('../../lib/component/indexes-component');

describe('IndexesComponent', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(IndexesComponent));
    var output = renderer.getRenderOutput();

    it('returns the indexes component div', function() {
      expect(output.type).to.equal('div');
    });
  });
});
