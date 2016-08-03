'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const IconButton = require('../../lib/component/icon-button');

function func() {
}

describe('IconButton', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { title: 'Test', clickHandler: func, iconClassName: 'testing' };
    renderer.render(React.createElement(IconButton, props));
    var output = renderer.getRenderOutput();

    it('returns the button', function() {
      expect(output.type).to.equal('button');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('btn btn-default btn-xs');
    });

    it('sets type', function() {
      expect(output.props.type).to.equal('button');
    });

    it('sets the title', function() {
      expect(output.props.title).to.equal('Test');
    });

    it('has a displayName', function() {
      expect(IconButton.displayName).to.equal('IconButton');
    });
  });
});
