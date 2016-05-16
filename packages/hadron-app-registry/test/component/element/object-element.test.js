'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const ObjectElement = require('../../../lib/component/element/object-element');
const ExpandableElement = require('../../../lib/component/expandable-element');

describe('ObjectElement', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: 'values', value: { test: 1 }, type: 'Object' };
    renderer.render(React.createElement(ObjectElement, props));
    var output = renderer.getRenderOutput();

    it('returns the expandable element', function() {
      expect(output.type).to.equal(ExpandableElement);
    });

    it('has a displayName', function() {
      expect(ObjectElement.displayName).to.equal('ObjectElement');
    });
  });
});
