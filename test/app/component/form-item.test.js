'use strict';

require('../../helpers');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormItem = require('compass-component').FormItem;

describe('FormItem', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(FormItem));
    var output = renderer.getRenderOutput();

    it('returns the form item div', function() {
      expect(output.type).to.equal('div');
    });

    it('sets the wrapper class name', function() {
      expect(output.props.className).to.equal('form-item');
    });
  });
});
