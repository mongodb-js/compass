'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const ArrayElement = require('../../../lib/component/element/array-element');
const ExpandableElement = require('../../../lib/component/expandable-element');

describe('ArrayElement', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: 'values', value: [ 1, 2, 3], type: 'Array' };
    renderer.render(React.createElement(ArrayElement, props));
    var output = renderer.getRenderOutput();

    it('returns the expandable element', function() {
      expect(output.type).to.equal(ExpandableElement);
    });

    it('has a displayName', function() {
      expect(ArrayElement.displayName).to.equal('ArrayElement');
    });
  });
});
