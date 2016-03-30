'use strict';

require('../../helpers');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const GroupedList = require('compass-component').GroupedList;

describe('GroupedList', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    renderer.render(React.createElement(GroupedList));
    var output = renderer.getRenderOutput();

    it('returns the grouped list div', function() {
      expect(output.type).to.equal('div');
    });

    it('sets the className', function() {
      expect(output.props.className).to.equal('grouped-list');
    });
  });
});
