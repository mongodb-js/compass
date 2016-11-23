'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');
const Decimal128 = require('bson').Decimal128;
const Decimal128Element = require('../../../lib/component/element/decimal128-element');

describe('Decimal128Element', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: '_id', value: Decimal128.fromString('123123'), type: 'Decimal128' };
    renderer.render(React.createElement(Decimal128Element, props));
    var output = renderer.getRenderOutput();

    it('returns the element li', function() {
      expect(output.type).to.equal('li');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('element');
    });

    it('has a displayName', function() {
      expect(Decimal128Element.displayName).to.equal('Decimal128Element');
    });

    it('sets the title', function() {
      expect(output.props.children[2].props.title).to.equal('123123');
    });

    it('sets the value', function() {
      expect(output.props.children[2].props.children).to.equal('123123');
    });
  });
});
