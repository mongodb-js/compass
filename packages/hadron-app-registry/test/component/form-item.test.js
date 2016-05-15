'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const FormItem = require('../../lib/component/form-item');

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

    it('has a displayName', function() {
      expect(FormItem.displayName).to.equal('FormItem');
    });
  });
});
