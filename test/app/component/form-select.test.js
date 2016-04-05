'use strict';

require('../../helpers');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormSelect = require('compass-component').FormSelect;

describe('FormSelect', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(FormSelect));
    var output = renderer.getRenderOutput();

    it('returns the form select input', function() {
      expect(output.type).to.equal('select');
    });

    it('sets the class name', function() {
      expect(output.props.className).to.equal('form-control');
    });
  });
});
