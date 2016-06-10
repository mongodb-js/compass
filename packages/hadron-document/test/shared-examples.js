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
      expect(this.doc.elements[0].key).to.equal('email');
    });

    it('adds the new embedded element', function() {
      expect(this.doc.elements[0].elements[0].key).to.equal('home');
    });

    it('sets the new embedded element value', function() {
      expect(this.doc.elements[0].elements[0].value).to.equal('home@example.com');
    });

    it('sets the absolute path of the new element', function() {
      expect(this.doc.elements[0].elements[0].absolutePath).to.equal('email.home');
    });

    it('flags the new element as added', function() {
      expect(this.doc.elements[0].elements[0].isAdded()).to.equal(true);
    });
  }
}

module.exports = new SharedExamples();
