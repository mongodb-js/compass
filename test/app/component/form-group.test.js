'use strict';

require('../../helpers');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormGroup = require('compass-component').FormGroup;

describe('FormGroup', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(FormGroup));
    var output = renderer.getRenderOutput();

    it('returns the form group div', function() {
      expect(output.type).to.equal('div');
    });

    it('sets the wrapper class name', function() {
      expect(output.props.className).to.equal('form-group');
    });
  });
});
