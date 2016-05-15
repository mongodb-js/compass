'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormInput = require('../../lib/component/form-input');

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

    it('has a displayName', function() {
      expect(FormInput.displayName).to.equal('FormInput');
    });
  });
});
