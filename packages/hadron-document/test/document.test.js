'use strict';

const chai = require('chai');
const expect = chai.expect;
const Document = require('../lib/document');

describe('Document', function() {
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
          expect(doc.elements[0].elements[0].absoluteKey).to.equal('email.work');
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
          expect(doc.elements[0].elements[0].elements[0].absoluteKey).to.equal('contact.email.work');
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
          expect(doc.elements[0].elements[0].elements[0].absoluteKey).to.equal('emails.0.work');
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
          expect(doc.elements[0].elements[0].elements[0].elements[0].absoluteKey).to.equal(
            'contact.emails.0.work'
          );
        });
      });
    });
  });
});
