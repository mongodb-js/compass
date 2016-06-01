'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const BinaryElement = require('../../../lib/component/element/binary-element');
const Element = require('../../../lib/component/element');

describe('BinaryElement', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: 'date', value: 'testing', type: 'Binary' };
    renderer.render(React.createElement(BinaryElement, props));
    var output = renderer.getRenderOutput();

    it('returns the element', function() {
      expect(output.type).to.equal(Element);
    });

    it('has a displayName', function() {
      expect(BinaryElement.displayName).to.equal('BinaryElement');
    });
  });
});
