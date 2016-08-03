'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const TextButton = require('../../lib/component/text-button');

function func() {
}

describe('TextButton', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { text: 'Test', clickHandler: func, className: 'testing' };
    renderer.render(React.createElement(TextButton, props));
    var output = renderer.getRenderOutput();

    it('returns the button', function() {
      expect(output.type).to.equal('button');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('testing');
    });

    it('sets type', function() {
      expect(output.props.type).to.equal('button');
    });

    it('sets the text', function() {
      expect(output.props.children).to.equal('Test');
    });

    it('has a displayName', function() {
      expect(TextButton.displayName).to.equal('TextButton');
    });
  });
});
