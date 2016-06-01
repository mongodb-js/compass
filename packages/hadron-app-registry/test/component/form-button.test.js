'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormButton = require('../../lib/component/form-button');

describe('FormButton', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(FormButton));
    var output = renderer.getRenderOutput();

    it('returns the form button', function() {
      expect(output.type).to.equal('button');
    });

    it('sets the class name', function() {
      expect(output.props.className).to.equal('btn btn-primary');
    });

    it('has a displayName', function() {
      expect(FormButton.displayName).to.equal('FormButton');
    });
  });
});
