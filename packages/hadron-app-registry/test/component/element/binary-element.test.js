'use strict';

require('../../helper');

const expect = require('chai').expect;
const Binary = require('bson').Binary;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const BinaryElement = require('../../../lib/component/element/binary-element');
const Element = require('../../../lib/component/element');

describe('BinaryElement', function() {
  describe('#render', function() {
    context('when the BSON value is a uuid', function() {
      var value = new Binary('testing', 4);
      var props = { field: 'data', value: value, type: 'Binary' };
      var renderer = ReactTestUtils.createRenderer();
      renderer.render(React.createElement(BinaryElement, props));
      var output = renderer.getRenderOutput();

      it('returns the element', function() {
        expect(output.type).to.equal(Element);
      });

      it('returns the raw value', function() {
        expect(output.props.value).to.equal('Binary(testing)');
      });

      it('has a displayName', function() {
        expect(BinaryElement.displayName).to.equal('BinaryElement');
      });
    });

    context('when the BSON value is an old uuid', function() {
      var value = new Binary('testing', 3);
      var props = { field: 'data', value: value, type: 'Binary' };
      var renderer = ReactTestUtils.createRenderer();
      renderer.render(React.createElement(BinaryElement, props));
      var output = renderer.getRenderOutput();

      it('returns the raw value', function() {
        expect(output.props.value).to.equal('Binary(testing)');
      });
    });

    context('when the BSON value is other data', function() {
      var value = new Binary('testing', 2);
      var props = { field: 'data', value: value, type: 'Binary' };
      var renderer = ReactTestUtils.createRenderer();
      renderer.render(React.createElement(BinaryElement, props));
      var output = renderer.getRenderOutput();

      it('returns the base 64 encoded value', function() {
        expect(output.props.value).to.equal('Binary(dGVzdGluZw==)');
      });
    });
  });
});
