'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const ExpandableElement = require('../../lib/component/expandable-element');

describe('ExpandableElement', function() {
  describe('#render', function() {
    context('when the element is not pre-expanded', function() {
      var renderer = ReactTestUtils.createRenderer();
      var props = { field: 'name', elements: [], type: 'Object' };
      renderer.render(React.createElement(ExpandableElement, props));
      var output = renderer.getRenderOutput();

      it('returns the element li', function() {
        expect(output.type).to.equal('li');
      });

      it('sets the className', function() {
        expect(output.props.className).to.equal('expandable-element');
      });

      it('has a displayName', function() {
        expect(ExpandableElement.displayName).to.equal('ExpandableElement');
      });
    });

    context('when the element is pre-expanded', function() {
      var renderer = ReactTestUtils.createRenderer();
      var props = { field: 'name', elements: [], type: 'Object', preExpanded: true };
      renderer.render(React.createElement(ExpandableElement, props));
      var output = renderer.getRenderOutput();
      var child = output.props.children[0];
      var className = 'expandable-element-header expandable-element-header-is-expanded';

      it('returns the element li', function() {
        expect(output.type).to.equal('li');
      });

      it('sets the expanded flag', function() {
        expect(child.props.className).to.equal(className);
      });

      it('has a displayName', function() {
        expect(ExpandableElement.displayName).to.equal('ExpandableElement');
      });
    });
  });
});
