'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const Form = require('../../lib/component/form');

describe('Form', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(Form));
    var output = renderer.getRenderOutput();

    it('returns the form', function() {
      expect(output.type).to.equal('form');
    });

    it('has a displayName', function() {
      expect(Form.displayName).to.equal('Form');
    });
  });
});
