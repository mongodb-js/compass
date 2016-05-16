'use strict';

require('../../helper');

const expect = require('chai').expect;
const React = require('react');
const ReactTestUtils = require('react-addons-test-utils');

const StringElement = require('../../../lib/component/element/string-element');
const Element = require('../../../lib/component/element');

describe('StringElement', function() {
  describe('#render', function() {
    var renderer = ReactTestUtils.createRenderer();
    var props = { field: 'date', value: 'testing', type: 'String' };
    renderer.render(React.createElement(StringElement, props));
    var output = renderer.getRenderOutput();

    it('returns the element', function() {
      expect(output.type).to.equal(Element);
    });

    it('has a displayName', function() {
      expect(StringElement.displayName).to.equal('StringElement');
    });
  });
});
