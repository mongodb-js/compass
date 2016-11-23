'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');
const Int32 = require('bson').Int32;
const Int32Element = require('../../../lib/component/element/int32-element');

describe('Int32Element', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: '_id', value: new Int32(1), type: 'Int32' };
    renderer.render(React.createElement(Int32Element, props));
    var output = renderer.getRenderOutput();

    it('returns the element li', function() {
      expect(output.type).to.equal('li');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('element');
    });

    it('has a displayName', function() {
      expect(Int32Element.displayName).to.equal('Int32Element');
    });

    it('sets the title', function() {
      expect(output.props.children[2].props.title).to.equal('1');
    });

    it('sets the value', function() {
      expect(output.props.children[2].props.children).to.equal('1');
    });
  });
});
