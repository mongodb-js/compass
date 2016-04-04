'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const Flexbox = require('../../lib/component/flexbox');

describe('Flexbox', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { id: 'id' };
    renderer.render(React.createElement(Flexbox, props));
    var output = renderer.getRenderOutput();

    it('returns the flexbox div', function() {
      expect(output.type).to.equal('div');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('flexbox');
    });

    it('sets additional properties', function() {
      expect(output.props.id).to.equal(props.id);
    });
  });
});
