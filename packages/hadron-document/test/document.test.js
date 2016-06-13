'use strict';

const chai = require('chai');
const expect = chai.expect;
const Document = require('../lib/document');
const SharedExamples = require('./shared-examples');

describe('Document', function() {
  describe('.add', function() {
    context('when the new element is a primitive value', function() {
      var doc = new Document({});

      before(function() {
        doc.add('name', 'Aphex Twin');
      });

      it('adds the new element', function() {
        expect(doc.elements[0].key).to.equal('name');
      });

      it('sets the new element value', function() {
        expect(doc.elements[0].value).to.equal('Aphex Twin');
      });

      it('sets the absolute path of the new element', function() {
        expect(doc.elements[0].absolutePath).to.equal('name');
      });

      it('flags the new element as added', function() {
        expect(doc.elements[0].isAdded()).to.equal(true);
      });
    });

    context('when the new embedded element is a document', function() {
      context('when setting directly', function() {
        before(function() {
          this.doc = new Document({});
          this.doc.add('email', { home: 'home@example.com' });
        });

        SharedExamples.itAddsTheEmbeddedDocumentElementToTheRootDocument();
      });

      context('when adding the embedded document then the first element', function() {
        before(function() {
          this.doc = new Document({});
          this.doc.add('email', {}).add('home', 'home@example.com');
        });

        SharedExamples.itAddsTheEmbeddedDocumentElementToTheRootDocument();
      });
    });

    context('when the embedded element is an array', function() {
      context('when setting directly', function() {
        before(function() {
          this.doc = new Document({});
          this.doc.add('emails', [ 'home@example.com' ]);
        });

        SharedExamples.itAddsTheArrayElementToTheRootDocument();
      });

      context('when adding the array and then the first element', function() {
        before(function() {
          this.doc = new Document({});
          this.doc.add('emails', []).add('0', 'home@example.com');
        });

        SharedExamples.itAddsTheArrayElementToTheRootDocument();
      });
    });

    context('when the embedded element is an array of embedded documents', function() {
      context('when setting directly', function() {
        before(function() {
          this.doc = new Document({});
          this.doc.add('emails', [{ home: 'home@example.com' }]);
        });

        SharedExamples.itAddsTheEmbeddedArrayElementToTheRootDocument();
      });

      context('when adding the array and then the first element', function() {
        before(function() {
          this.doc = new Document({});
          this.doc.add('emails', []).add('0', {}).add('home', 'home@example.com');
        });

        SharedExamples.itAddsTheEmbeddedArrayElementToTheRootDocument();
      });
    });
  });

  describe('.new', function() {
    context('when the document is flat', function() {
      var object = { name: 'Aphex Twin' };
      var doc = new Document(object);

      it('creates the element', function() {
        expect(doc.elements.length).to.equal(1);
      });

      it('sets the element original key', function() {
        expect(doc.elements[0].key).to.equal('name');
      });

      it('sets the element current key', function() {
        expect(doc.elements[0].currentKey).to.equal('name');
      });

      it('sets the element original value', function() {
        expect(doc.elements[0].value).to.equal('Aphex Twin');
      });

      it('sets the element current value', function() {
        expect(doc.elements[0].currentValue).to.equal('Aphex Twin');
      });
    });

    context('when the document has arrays', function() {
      var object = { studios: [ 'London', 'New York' ]};
      var doc = new Document(object);

      it('creates the element', function() {
        expect(doc.elements.length).to.equal(1);
      });

      it('sets the element original key', function() {
        expect(doc.elements[0].key).to.equal('studios');
      });

      it('sets the element current key', function() {
        expect(doc.elements[0].currentKey).to.equal('studios');
      });

      it('sets the element indexes', function() {
        expect(doc.elements[0].elements[0].key).to.equal('0');
        expect(doc.elements[0].elements[1].key).to.equal('1');
      });

      it('sets the element original values', function() {
        expect(doc.elements[0].elements[0].value).to.equal('London');
        expect(doc.elements[0].elements[1].value).to.equal('New York');
      });

      it('sets the element current values', function() {
        expect(doc.elements[0].elements[0].currentValue).to.equal('London');
        expect(doc.elements[0].elements[1].currentValue).to.equal('New York');
      });
    });

    context('when the document has children', function() {
      context('when the document has an embedded document', function() {
        var object = { email: { work: 'test@example.com' }};
        var doc = new Document(object);

        it('creates the element', function() {
          expect(doc.elements.length).to.equal(1);
        });

        it('sets the element original key', function() {
          expect(doc.elements[0].key).to.equal('email');
        });

        it('sets the element current key', function() {
          expect(doc.elements[0].currentKey).to.equal('email');
        });

        it('sets the embedded element key', function() {
          expect(doc.elements[0].elements[0].key).to.equal('work');
          expect(doc.elements[0].elements[0].currentKey).to.equal('work');
        });

        it('sets the embedded element original value', function() {
          expect(doc.elements[0].elements[0].value).to.equal('test@example.com');
        });

        it('sets the embedded element current value', function() {
          expect(doc.elements[0].elements[0].currentValue).to.equal('test@example.com');
        });

        it('determines the correct path', function() {
          expect(doc.elements[0].elements[0].absolutePath).to.equal('email.work');
        });
      });

      context('when the document has multi level embedded documents', function() {
        var object = { contact: { email: { work: 'test@example.com' }}};
        var doc = new Document(object);

        it('creates the element', function() {
          expect(doc.elements.length).to.equal(1);
        });

        it('sets the element original key', function() {
          expect(doc.elements[0].key).to.equal('contact');
        });

        it('sets the embedded element key', function() {
          expect(doc.elements[0].elements[0].key).to.equal('email');
        });

        it('sets the multi embedded element key', function() {
          expect(doc.elements[0].elements[0].elements[0].key).to.equal('work');
        });

        it('sets the embedded element original value', function() {
          expect(doc.elements[0].elements[0].elements[0].value).to.equal('test@example.com');
        });

        it('determines the correct path', function() {
          expect(doc.elements[0].elements[0].elements[0].absolutePath).to.equal('contact.email.work');
        });
      });

      context('when the document has an array of embedded documents', function() {
        var object = { emails: [{ work: 'test@example.com' }]};
        var doc = new Document(object);

        it('creates the element', function() {
          expect(doc.elements.length).to.equal(1);
        });

        it('sets the element original key', function() {
          expect(doc.elements[0].key).to.equal('emails');
        });

        it('sets the embedded element key', function() {
          expect(doc.elements[0].elements[0].key).to.equal('0');
        });

        it('sets the multi embedded element key', function() {
          expect(doc.elements[0].elements[0].elements[0].key).to.equal('work');
        });

        it('sets the embedded element original value', function() {
          expect(doc.elements[0].elements[0].elements[0].value).to.equal('test@example.com');
        });

        it('determines the correct path', function() {
          expect(doc.elements[0].elements[0].elements[0].absolutePath).to.equal('emails.0.work');
        });
      });

      context('when the document has an embedded array of embedded documents', function() {
        var object = { contact: { emails: [{ work: 'test@example.com' }]}};
        var doc = new Document(object);

        it('creates the element', function() {
          expect(doc.elements.length).to.equal(1);
        });

        it('sets the element original key', function() {
          expect(doc.elements[0].key).to.equal('contact');
        });

        it('sets the embedded element key', function() {
          expect(doc.elements[0].elements[0].key).to.equal('emails');
        });

        it('sets the multi embedded element key', function() {
          expect(doc.elements[0].elements[0].elements[0].key).to.equal('0');
        });

        it('sets the lowest level embedded element key', function() {
          expect(doc.elements[0].elements[0].elements[0].elements[0].key).to.equal('work');
        });

        it('sets the embedded element original value', function() {
          expect(doc.elements[0].elements[0].elements[0].elements[0].value).to.equal(
            'test@example.com'
          );
        });

        it('determines the correct path', function() {
          expect(doc.elements[0].elements[0].elements[0].elements[0].absolutePath).to.equal(
            'contact.emails.0.work'
          );
        });
      });
    });
  });

  /**
   * Functional test that mirros the mockups for the document edit screen.
   */
  context('when editing an existing document', function() {
    var object = {
      address: {
        postal_code: '72550'
      },
      email: 'test@example.com'
    };
    var doc = new Document(object);
    var address = doc.elements[0];
    var postalCode = address.elements[0];
    var email = doc.elements[1];

    it('sets the postal code edit', function() {
      postalCode.edit(72550);
      expect(postalCode.value).to.equal('72550');
      expect(postalCode.currentValue).to.equal(72550);
      expect(postalCode.isEdited()).to.equal(true);
    });

    it('adds the state to the address', function() {
      var state = address.add('state', 'CA');
      expect(state.key).to.equal('state');
      expect(state.value).to.equal('CA');
      expect(state.isAdded()).to.equal(true);
    });

    it('changes the email to an embedded document', function() {
      email.rename('emails');
      email.edit({});
      expect(email.key).to.equal('email');
      expect(email.currentKey).to.equal('emails');
      expect(email.elements.length).to.equal(0);
    });

    it('adds the home email element', function() {
      var home = email.add('home', 'home@example.com');
      expect(email.elements.length).to.equal(1);
      expect(home.key).to.equal('home');
      expect(home.value).to.equal('home@example.com');
      expect(home.isAdded()).to.equal(true);
    });

    it('adds the work email element', function() {
      var work = email.add('work', 'work@example.com');
      expect(email.elements.length).to.equal(2);
      expect(work.key).to.equal('work');
      expect(work.value).to.equal('work@example.com');
      expect(work.isAdded()).to.equal(true);
    });

    it('generates an update object', function() {
      expect(doc.generateObject()).to.deep.equal({
        address: {
          postal_code: 72550,
          state: 'CA'
        },
        emails: {
          home: 'home@example.com',
          work: 'work@example.com'
        }
      });
    });
  });
});
