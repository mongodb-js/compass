'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const Field = require('../../lib/component/field');

describe('Field', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: '_id' };
    renderer.render(React.createElement(Field, props));
    var output = renderer.getRenderOutput();

    it('returns the field div', function() {
      expect(output.type).to.equal('div');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('element-field');
    });

    it('has a displayName', function() {
      expect(Field.displayName).to.equal('Field');
    });
  });
});
