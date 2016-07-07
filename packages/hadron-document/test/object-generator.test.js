'use strict';

const chai = require('chai');
const expect = chai.expect;
const Document = require('../lib/document');
const ObjectGenerator = require('../lib/object-generator');

describe('ObjectGenerator', function() {
  describe('#generate', function() {
    context('when an element is removed', function() {
      var object = { name: 'test' };
      var doc = new Document(object);

      before(function() {
        doc.elements.at(0).remove();
      });

      it('does not include the element in the object', function() {
        expect(ObjectGenerator.generate(doc.elements)).to.deep.equal({});
      });
    });

    context('when an element is blank', function() {
      var object = { name: 'test' };
      var doc = new Document(object);

      before(function() {
        doc.elements.at(0).rename('');
      });

      it('does not include the element in the object', function() {
        expect(ObjectGenerator.generate(doc.elements)).to.deep.equal({});
      });
    });
  });

  describe('#generateArray', function() {
    var object = { names: [ 'a', 'b', 'c' ]};
    var doc = new Document(object);

    context('when an element is removed', function() {
      before(function() {
        doc.elements.at(0).elements.at(1).remove();
      });

      it('does not include the element in the object', function() {
        expect(ObjectGenerator.generateArray(doc.elements.at(0).elements)).to.deep.equal([ 'a', 'c' ]);
      });
    });
  });
});
