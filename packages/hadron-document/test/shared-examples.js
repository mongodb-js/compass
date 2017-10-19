'use strict';

const chai = require('chai');
const expect = chai.expect;

/**
 * Shared examples including assertions for reusability in the tests.
 */
class SharedExamples {

  /**
   * Example for testing an embedded document getting added to the root
   * document.
   */
  itAddsTheEmbeddedDocumentElementToTheRootDocument() {
    it('adds the new element', function() {
      expect(this.doc.elements.at(0).key).to.equal('email');
    });

    it('adds the new embedded element', function() {
      expect(this.doc.elements.at(0).elements.at(0).key).to.equal('home');
    });

    it('sets the new embedded element value', function() {
      expect(this.doc.elements.at(0).elements.at(0).value).to.equal('home@example.com');
    });

    it('flags the new element as added', function() {
      expect(this.doc.elements.at(0).elements.at(0).isAdded()).to.equal(true);
    });
  }

  /**
   * Example for testing an array getting added to the root document.
   */
  itAddsTheArrayElementToTheRootDocument() {
    it('adds the new element', function() {
      expect(this.doc.elements.at(0).key).to.equal('emails');
    });

    it('adds the new embedded element', function() {
      expect(this.doc.elements.at(0).elements.at(0).key).to.equal(0);
    });

    it('sets the new embedded element value', function() {
      expect(this.doc.elements.at(0).elements.at(0).value).to.equal('home@example.com');
    });

    it('flags the new element as added', function() {
      expect(this.doc.elements.at(0).elements.at(0).isAdded()).to.equal(true);
    });
  }

  /**
   * Example for testing an array of embedded documents getting added to the root document.
   */
  itAddsTheEmbeddedArrayElementToTheRootDocument() {
    it('adds the new element', function() {
      expect(this.doc.elements.at(0).key).to.equal('emails');
    });

    it('adds the new embedded element', function() {
      expect(this.doc.elements.at(0).elements.at(0).key).to.equal(0);
    });

    it('sets the new embedded element document key', function() {
      expect(this.doc.elements.at(0).elements.at(0).elements.at(0).key).to.equal('home');
    });

    it('sets the new embedded element document value', function() {
      expect(this.doc.elements.at(0).elements.at(0).elements.at(0).value).to.equal('home@example.com');
    });

    it('flags the new element as added', function() {
      expect(this.doc.elements.at(0).elements.at(0).elements.at(0).isAdded()).to.equal(true);
    });
  }
}

module.exports = new SharedExamples();
