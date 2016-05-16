'use strict';

require('../../helper');

const expect = require('chai').expect;
const Factory = require('../../../lib/component/element/factory');
const ArrayElement = require('../../../lib/component/element/array-element');
const DateElement = require('../../../lib/component/element/date-element');
const ObjectElement = require('../../../lib/component/element/object-element');
const StringElement = require('../../../lib/component/element/string-element');
const Element = require('../../../lib/component/element');

describe('Factory', function() {
  describe('#_elementComponent', function() {
    context('when the element type is Array', function() {
      it('returns the array element', function() {
        expect(Factory._elementComponent('Array')).to.equal(ArrayElement);
      });
    });

    context('when the element type is Date', function() {
      it('returns the date element', function() {
        expect(Factory._elementComponent('Date')).to.equal(DateElement);
      });
    });

    context('when the element type is Object', function() {
      it('returns the object element', function() {
        expect(Factory._elementComponent('Object')).to.equal(ObjectElement);
      });
    });

    context('when the element type is String', function() {
      it('returns the string element', function() {
        expect(Factory._elementComponent('String')).to.equal(StringElement);
      });
    });

    context('when the element type is not found', function() {
      it('returns the default element', function() {
        expect(Factory._elementComponent('Integer')).to.equal(Element);
      });
    });
  });
});
