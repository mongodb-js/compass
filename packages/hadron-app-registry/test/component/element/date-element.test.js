'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const DateElement = require('../../../lib/component/element/date-element');
const Element = require('../../../lib/component/element');

describe('DateElement', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: 'date', value: new Date(), type: 'Date' };
    renderer.render(React.createElement(DateElement, props));
    var output = renderer.getRenderOutput();

    it('returns the element', function() {
      expect(output.type).to.equal(Element);
    });

    it('has a displayName', function() {
      expect(DateElement.displayName).to.equal('DateElement');
    });
  });
});
