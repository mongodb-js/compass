'use strict';

require('../../helpers');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormInput = require('compass-component').FormInput;

describe('FormInput', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(FormInput));
    var output = renderer.getRenderOutput();

    it('returns the form input text input', function() {
      expect(output.type).to.equal('input');
    });

    it('sets the class name', function() {
      expect(output.props.className).to.equal('form-control');
    });
  });
});
