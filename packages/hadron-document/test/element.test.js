'use strict';

const bson = require('bson');
const ObjectId = bson.ObjectId;
const Binary = bson.Binary;
const Code = bson.Code;
const MaxKey = bson.MaxKey;
const MinKey = bson.MinKey;
const Timestamp = bson.Timestamp;

const chai = require('chai');
const expect = chai.expect;
const Document = require('../lib/document');
const Element = require('../lib/element');

describe('Element', function() {
  describe('#add', function() {
    context('when the new embedded element is a document', function() {
      var doc = new Document({});
      var element = new Element('email', { work: 'work@example.com' }, false, doc);

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
      var doc = new Document({});
      var element = new Element('emails', [ 'work@example.com' ], false, doc);

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

    context('when the embedded element is an array of embedded documents', function() {
      var doc = new Document({});
      var element = new Element('emails', [], false, doc);

      before(function() {
        element.add('0', '').edit({ home: 'home@example.com' });
      });

      it('adds the new embedded element', function() {
        expect(element.elements[0].key).to.equal('0');
        expect(element.elements[0].elements[0].key).to.equal('home');
        expect(element.elements[0].elements[0].value).to.equal('home@example.com');
      });

      it('sets the absolute path of the new element', function() {
        expect(element.elements[0].absolutePath).to.equal('emails.0');
        expect(element.elements[0].elements[0].absolutePath).to.equal('emails.0.home');
      });

      it('flags the new elements as added', function() {
        expect(element.elements[0].isAdded()).to.equal(true);
        expect(element.elements[0].elements[0].isAdded()).to.equal(true);
      });

      it('does not flag the new elements as edited', function() {
        expect(element.elements[0].isEdited()).to.equal(false);
        expect(element.elements[0].elements[0].isEdited()).to.equal(false);
      });
    });
  });

  describe('#isLast', function() {
    var doc = new Document({});
    var first = doc.add('first', 'test');
    var last = doc.add('last', 'test');

    context('when the element is the last element', function() {
      it('returns true', function() {
        expect(last.isLast()).to.equal(true);
      });
    });

    context('when the element is not the last element', function() {
      it('returns false', function() {
        expect(first.isLast()).to.equal(false);
      });
    });
  });

  describe('#next', function() {
    context('when the element is the last element in the parent', function() {
      context('when the value is changed to {', function() {
        var doc = new Document({});
        var first = doc.add('first', 'test');
        var last = doc.add('last', 'test');

        before(function() {
          last.edit('{');
          last.next();
        });

        it('changes the element to an object', function() {
          expect(last.elements[0].currentKey).to.equal('');
          expect(last.elements[0].currentValue).to.equal('');
        });
      });

      context('when the value is changed to [', function() {
        var doc = new Document({});
        var first = doc.add('first', 'test');
        var last = doc.add('last', 'test');

        before(function() {
          last.edit('[');
          last.next();
        });

        it('changes the element to an array', function() {
          expect(last.elements[0].currentKey).to.equal('0');
          expect(last.elements[0].currentValue).to.equal('');
        });
      });

      context('when the value is different', function() {
        var doc = new Document({});
        var first = doc.add('first', 'test');
        var last = doc.add('last', 'test');

        before(function() {
          last.edit('test');
          last.next();
        });

        it('adds another element to the parent', function() {
          expect(doc.elements[2].currentKey).to.equal('');
          expect(doc.elements[2].currentValue).to.equal('');
        });
      });
    });

    context('when the element is not the last element is in the parent', function() {
      var doc = new Document({});
      var first = doc.add('first', 'test');
      var last = doc.add('last', 'test');

      before(function() {
        first.next();
      });

      it('does not make changes', function() {
        expect(doc.elements.length).to.equal(2);
      });
    });
  });

  describe('#isValueEditable', function() {
    context('when the key is _id', function() {
      var element = new Element('_id', 'test', false);

      it('returns false', function() {
        expect(element.isValueEditable()).to.equal(false);
      });
    });

    context('when the key is not _id', function() {
      context('when the type is ObjectId', function() {
        var element = new Element('name', new ObjectId(), false);

        it('returns false', function() {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is binary', function() {
        var element = new Element('name', new Binary('test'), false);

        it('returns false', function() {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is code', function() {
        var element = new Element('name', new Code('test'), false);

        it('returns false', function() {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is min key', function() {
        var element = new Element('name', new MinKey(), false);

        it('returns false', function() {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is max key', function() {
        var element = new Element('name', new MaxKey(), false);

        it('returns false', function() {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is a timestamp', function() {
        var element = new Element('name', new Timestamp(0, 0), false);

        it('returns false', function() {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is editable', function() {
        var element = new Element('name', 'test', false);

        it('returns true', function() {
          expect(element.isValueEditable()).to.equal(true);
        });
      });
    });
  });

  describe('#isModified', function() {
    context('when the element has no children', function() {
      context('when the element is not modified', function() {
        var element = new Element('name', 'Aphex Twin', false);

        it('returns false', function() {
          expect(element.isModified()).to.equal(false);
        });
      });

      context('when the element is added', function() {
        var element = new Element('name', 'Aphex Twin', true);

        it('returns true', function() {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is edited', function() {
        var element = new Element('name', 'Aphex Twin', false);

        before(function() {
          element.edit('APX');
        });

        it('returns true', function() {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is removed', function() {
        var element = new Element('name', 'Aphex Twin', false);

        before(function() {
          element.remove();
        });

        it('returns true', function() {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is reverted', function() {
        var element = new Element('name', 'Aphex Twin', false);

        before(function() {
          element.edit('APX');
          element.revert();
        });

        it('returns false', function() {
          expect(element.isModified()).to.equal(false);
        });
      });
    });

    context('when the element has children', function() {
      context('when a child element is added', function() {
        var element = new Element('names', [], false);

        before(function() {
          element.add('0', 'testing');
        });

        it('returns true', function() {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when a child element is edited', function() {
        var element = new Element('names', [ 'testing' ], false);

        before(function() {
          element.elements[0].edit('test');
        });

        it('returns true', function() {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when a child element is removed', function() {
        var element = new Element('names', [ 'testing' ], false);

        before(function() {
          element.elements[0].remove();
        });

        it('returns true', function() {
          expect(element.isModified()).to.equal(true);
        });
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

      it('sets the element type', function() {
        expect(element.type).to.equal('String');
      });

      it('sets the element current type', function() {
        expect(element.currentType).to.equal('String');
      });

      it('creates a uuid', function() {
        expect(element.uuid).to.not.equal(null);
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

      it('sets the element type', function() {
        expect(element.type).to.equal('Array');
      });

      it('sets the element current type', function() {
        expect(element.currentType).to.equal('Array');
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

      it('sets the element type', function() {
        expect(element.type).to.equal('Object');
      });

      it('sets the element current type', function() {
        expect(element.currentType).to.equal('Object');
      });
    });
  });

  describe('#edit', function() {
    context('when the element is not a document', function() {
      context('when the value is changed', function() {
        context('when the value is changed to another primitive', function() {
          var element = new Element('name', 'Aphex Twin', false);

          before(function() {
            element.edit('APX');
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

        context('when the value is changed to an empty embedded document', function() {
          var element = new Element('email', 'test@example.com', false);

          before(function() {
            element.edit({});
          });

          it('changes the document to an embedded document', function() {
            expect(element.elements.length).to.equal(0);
          });

          it('removes the current value', function() {
            expect(element.currentValue).to.equal(null);
          });

          it('keeps the original value as the primitive', function() {
            expect(element.value).to.equal('test@example.com');
          });

          it('flags the element as edited', function() {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function() {
            expect(element.currentType).to.equal('Object');
          });
        });

        context('when the value is changed to an embedded document', function() {
          var element = new Element('email', 'test@example.com', false);

          before(function() {
            element.edit({ home: 'home@example.com' });
          });

          it('changes the document to an embedded document', function() {
            expect(element.elements.length).to.equal(1);
            expect(element.elements[0].key).to.equal('home');
            expect(element.elements[0].value).to.equal('home@example.com');
          });

          it('removes the current value', function() {
            expect(element.currentValue).to.equal(null);
          });

          it('keeps the original value as the primitive', function() {
            expect(element.value).to.equal('test@example.com');
          });

          it('flags the element as edited', function() {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function() {
            expect(element.currentType).to.equal('Object');
          });
        });

        context('when the value is changed to an empty array', function() {
          var element = new Element('email', 'test@example.com', false);

          before(function() {
            element.edit([]);
          });

          it('changes the document to an embedded document', function() {
            expect(element.elements.length).to.equal(0);
          });

          it('removes the current value', function() {
            expect(element.currentValue).to.equal(null);
          });

          it('keeps the original value as the primitive', function() {
            expect(element.value).to.equal('test@example.com');
          });

          it('flags the element as edited', function() {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function() {
            expect(element.currentType).to.equal('Array');
          });
        });

        context('when the value is changed to an array', function() {
          var element = new Element('email', 'test@example.com', false);

          before(function() {
            element.edit([ 'home@example.com' ]);
          });

          it('changes the document to an embedded document', function() {
            expect(element.elements.length).to.equal(1);
            expect(element.elements[0].key).to.equal('0');
            expect(element.elements[0].value).to.equal('home@example.com');
          });

          it('removes the current value', function() {
            expect(element.currentValue).to.equal(null);
          });

          it('keeps the original value as the primitive', function() {
            expect(element.value).to.equal('test@example.com');
          });

          it('flags the element as edited', function() {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function() {
            expect(element.currentType).to.equal('Array');
          });
        });
      });

      context('when the value is changed', function() {
        var element = new Element('name', 'Aphex Twin', false);

        before(function() {
          element.edit('APX');
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

  describe('#rename', function() {
    var element = new Element('name', 'Aphex Twin', false);

    before(function() {
      element.rename('alias');
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

    context('when the element has been added to a parent', function() {
      var doc = new Document({});
      var element = doc.add('name', 'test');

      before(function() {
        element.remove();
      });

      it('removes the element from the parent', function() {
        expect(doc.elements.length).to.equal(0);
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

    context('when the element itself has been added', function() {
      var doc = new Document({});
      var element = doc.add('name', 'Aphex Twin');

      before(function() {
        element.revert();
      });

      it('removes the element from the parent document', function() {
        expect(doc.elements.length).to.equal(0);
      });
    });
  });
});
