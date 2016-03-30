'use strict';

require('../../helpers');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormOption = require('compass-component').FormOption;

describe('FormOption', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { value: 'value', name: 'name' };
    renderer.render(React.createElement(FormOption, props));
    var output = renderer.getRenderOutput();

    it('returns the form option', function() {
      expect(output.type).to.equal('option');
    });

    it('sets the value property', function() {
      expect(output.props.value).to.equal(props.value);
    });

    it('sets the child name', function() {
      expect(output.props.children).to.equal(props.name);
    });
  });
});
