'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const Element = require('../../lib/component/element');

class MyObject {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

describe('Element', function() {
  describe('#render', function() {
    context('when the value is a standard value', function() {
      var renderer = ReactTestUtils.createRenderer();
      var props = { field: '_id', value: 1, type: 'Integer' };
      renderer.render(React.createElement(Element, props));
      var output = renderer.getRenderOutput();

      it('returns the element li', function() {
        expect(output.type).to.equal('li');
      });

      it('sets the className', function() {
        expect(output.props.className).to.equal('document-property integer');
      });

      it('has a displayName', function() {
        expect(Element.displayName).to.equal('Element');
      });
    });

    context('when the value is an object', function() {
      var renderer = ReactTestUtils.createRenderer();
      var props = { field: '_id', value: new MyObject('testing'), type: 'MyObject' };
      renderer.render(React.createElement(Element, props));
      var output = renderer.getRenderOutput();

      it('returns the element li', function() {
        expect(output.type).to.equal('li');
      });

      it('sets the className', function() {
        expect(output.props.className).to.equal('document-property myobject');
      });

      it('has a displayName', function() {
        expect(Element.displayName).to.equal('Element');
      });
    });
  });
});
