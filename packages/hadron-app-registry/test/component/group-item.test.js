'use strict';

require('../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const GroupItem = require('../../lib/component/group-item');

describe('GroupItem', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(GroupItem));
    var output = renderer.getRenderOutput();

    it('returns the group li', function() {
      expect(output.type).to.equal('li');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('group-item');
    });
  });
});
