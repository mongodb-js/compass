'use strict';

const chai = require('chai');
const expect = chai.expect;
const Element = require('../lib/element');

describe('Element', function() {
  describe('#add', function() {
    context('when the new embedded element is a document', function() {
      var element = new Element('email', { work: 'work@example.com' }, false);

      before(function() {
        element.add('home', 'home@example.com');
      });

      it('adds the new embedded element', function() {
        expect(element.elements[1].key).to.equal('home');
        expect(element.elements[1].value).to.equal('home@example.com');
      });

      it('sets the absolute path of the new element', function() {
        expect(element.elements[1].absolutePath).to.equal('email.home');
      });

      it('flags the new element as added', function() {
        expect(element.elements[1].isAdded()).to.equal(true);
      });
    });

    context('when the embedded element is an array', function() {
      var element = new Element('emails', [ 'work@example.com' ], false);

      before(function() {
        element.add('1', 'home@example.com');
      });

      it('adds the new embedded element', function() {
        expect(element.elements[1].key).to.equal('1');
        expect(element.elements[1].value).to.equal('home@example.com');
      });

      it('sets the absolute path of the new element', function() {
        expect(element.elements[1].absolutePath).to.equal('emails.1');
      });

      it('flags the new element as added', function() {
        expect(element.elements[1].isAdded()).to.equal(true);
      });
    });
  });

  describe('#new', function() {
    context('when the element is primitive', function() {
      var element = new Element('name', 'Aphex Twin', false);

      it('sets the key', function() {
        expect(element.key).to.equal('name');
      });

      it('sets the current key', function() {
        expect(element.currentKey).to.equal('name');
      });

      it('sets the value', function() {
        expect(element.value).to.equal('Aphex Twin');
      });

      it('sets the current value', function() {
        expect(element.currentValue).to.equal('Aphex Twin');
      });
    });

    context('when the element is an array', function() {
      var element = new Element('albums', [ 'Windowlicker' ], false);

      it('sets the key', function() {
        expect(element.key).to.equal('albums');
      });

      it('sets the current key', function() {
        expect(element.currentKey).to.equal('albums');
      });

      it('sets the elements', function() {
        expect(element.elements.length).to.equal(1);
      });
    });

    context('when the element is an embedded document', function() {
      var element = new Element('email', { work: 'test@example.com' }, false);

      it('sets the key', function() {
        expect(element.key).to.equal('email');
      });

      it('sets the current key', function() {
        expect(element.currentKey).to.equal('email');
      });

      it('sets the elements', function() {
        expect(element.elements.length).to.equal(1);
      });
    });
  });

  describe('#edit', function() {
    context('when the element is not a document', function() {
      context('when the value is changed', function() {
        var element = new Element('name', 'Aphex Twin', false);

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
        var element = new Element('name', 'Aphex Twin', false);

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
        var element = new Element('name', 'Aphex Twin', false);

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
      var element = new Element('name', 'Aphex Twin', false);

      before(function() {
        element.remove();
      });

      it('flags the element as removed', function() {
        expect(element.isRemoved()).to.equal(true);
      });
    });

    context('when the element has been edited', function() {
      var element = new Element('name', 'Aphex Twin', false);

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

  describe('#revert', function() {
    context('when the element is edited', function() {
      var element = new Element('name', 'Aphex Twin', false);

      before(function() {
        element.edit('alias', 'APX');
        element.revert();
      });

      it('sets the keys back to the original', function() {
        expect(element.key).to.equal('name');
        expect(element.currentKey).to.equal('name');
      });

      it('sets the values back to the original', function() {
        expect(element.value).to.equal('Aphex Twin');
        expect(element.currentValue).to.equal('Aphex Twin');
      });

      it('resets the flags', function() {
        expect(element.isEdited()).to.equal(false);
      });
    });

    context('when the element is removed', function() {
      var element = new Element('name', 'Aphex Twin', false);

      before(function() {
        element.remove();
        element.revert();
      });

      it('sets the keys back to the original', function() {
        expect(element.key).to.equal('name');
        expect(element.currentKey).to.equal('name');
      });

      it('sets the values back to the original', function() {
        expect(element.value).to.equal('Aphex Twin');
        expect(element.currentValue).to.equal('Aphex Twin');
      });

      it('resets the flags', function() {
        expect(element.isRemoved()).to.equal(false);
      });
    });

    context('when elements have been added', function() {
      var element = new Element('email', { work: 'work@example.com' }, false);

      before(function() {
        element.add('home', 'home@example.com');
        element.revert();
      });

      it('sets the keys back to the original', function() {
        expect(element.key).to.equal('email');
        expect(element.currentKey).to.equal('email');
      });

      it('sets the elements back to the original', function() {
        expect(element.elements.length).to.equal(1);
        expect(element.elements[0].key).to.equal('work');
      });
    });
  });
});
