'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');
const Double = require('bson').Double;
const DoubleElement = require('../../../lib/component/element/double-element');

describe('DoubleElement', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: '_id', value: new Double(12.123), type: 'Double' };
    renderer.render(React.createElement(DoubleElement, props));
    var output = renderer.getRenderOutput();

    it('returns the element li', function() {
      expect(output.type).to.equal('li');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('element');
    });

    it('has a displayName', function() {
      expect(DoubleElement.displayName).to.equal('DoubleElement');
    });

    it('sets the title', function() {
      expect(output.props.children[2].props.title).to.equal('12.123');
    });

    it('sets the value', function() {
      expect(output.props.children[2].props.children).to.equal('12.123');
    });
  });
});
