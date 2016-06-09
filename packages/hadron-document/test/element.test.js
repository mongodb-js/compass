'use strict';

const chai = require('chai');
const expect = chai.expect;
const Element = require('../lib/element');

describe('Element', function() {
  describe('#edit', function() {
    context('when the element is not a document', function() {
      context('when the value is changed', function() {
        var element = new Element('name', 'Aphex Twin');

        before(function() {
          element.edit('name', 'APX');
        });

        it('updates the current value', function() {
          expect(element.currentValue).to.equal('APX');
        });

        it('does not modify the original', function() {
          expect(element.value).to.equal('Aphex Twin');
        });

        it('flags the element as edited', function() {
          expect(element.isEdited()).to.equal(true);
        });
      });

      context('when the key is changed', function() {
        var element = new Element('name', 'Aphex Twin');

        before(function() {
          element.edit('alias', 'Aphex Twin');
        });

        it('updates the current key', function() {
          expect(element.currentKey).to.equal('alias');
        });

        it('does not modify the original', function() {
          expect(element.key).to.equal('name');
        });

        it('flags the element as edited', function() {
          expect(element.isEdited()).to.equal(true);
        });
      });

      context('when the key and value are changed', function() {
        var element = new Element('name', 'Aphex Twin');

        before(function() {
          element.edit('alias', 'APX');
        });

        it('updates the current key', function() {
          expect(element.currentKey).to.equal('alias');
        });

        it('does not modify the original', function() {
          expect(element.key).to.equal('name');
        });

        it('updates the current value', function() {
          expect(element.currentValue).to.equal('APX');
        });

        it('does not modify the original', function() {
          expect(element.value).to.equal('Aphex Twin');
        });

        it('flags the element as edited', function() {
          expect(element.isEdited()).to.equal(true);
        });
      });
    });
  });

  describe('#remove', function() {
    context('when the element has not been edited', function() {
      var element = new Element('name', 'Aphex Twin');

      before(function() {
        element.remove();
      });

      it('flags the element as removed', function() {
        expect(element.isRemoved()).to.equal(true);
      });
    });

    context('when the element has been edited', function() {
      var element = new Element('name', 'Aphex Twin');

      before(function() {
        element.edit('name', 'APX');
        element.remove();
      });

      it('flags the element as removed', function() {
        expect(element.isRemoved()).to.equal(true);
      });

      it('resets the edits to the original', function() {
        expect(element.isEdited()).to.equal(false);
      });
    });
  });
});
