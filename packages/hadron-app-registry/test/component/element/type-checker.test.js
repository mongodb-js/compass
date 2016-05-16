'use strict';

const expect = require('chai').expect;
const TypeChecker = require('../../../lib/component/element/type-checker');

describe('TypeChecker', function() {
  describe('#type', function() {
    context('when the object is a string', function() {
      it('returns String', function() {
        expect(TypeChecker.type('testing')).to.equal('String');
      })
    });

    context('when the object is an object', function() {
      it('returns Object', function() {
        expect(TypeChecker.type({})).to.equal('Object');
      });
    });

    context('when the object is an Array', function() {
      it('returns Array', function() {
        expect(TypeChecker.type([ 'test' ])).to.equal('Array');
      });
    });
  });
});
