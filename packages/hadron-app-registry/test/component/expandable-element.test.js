'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const ExpandableElement = require('../../lib/component/expandable-element');

describe('ExpandableElement', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: 'name', elements: [], type: 'Object' };
    renderer.render(React.createElement(ExpandableElement, props));
    var output = renderer.getRenderOutput();

    it('returns the element li', function() {
      expect(output.type).to.equal('li');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('document-property object');
    });

    it('has a displayName', function() {
      expect(ExpandableElement.displayName).to.equal('ExpandableElement');
    });
  });
});
