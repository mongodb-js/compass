/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;

// const debug = require('debug')('mongodb-compass:test:query-changed-store');

let OpenInsertDocumentDialogStore = require('../../src/internal-packages/crud/lib/store/open-insert-document-dialog-store');

describe('OpenInsertDocumentDialogStore', () => {
  let unsubscribe = () => {};

  afterEach(() => {
    unsubscribe();
    unsubscribe = () => {};
  });

  context('when inserting a new document', () => {
    it('keeps the document as is without modifications', (done) => {
      const doc = {
        _id: 'foo',
        field: 'bar'
      };
      unsubscribe = OpenInsertDocumentDialogStore.listen((hadronDoc) => {
        expect(hadronDoc.generateObject()).to.be.deep.equal(doc);
        done();
      });
      OpenInsertDocumentDialogStore.openInsertDocumentDialog(doc, false);
    });
  });

  context('when cloning a document', () => {
    it('removes the _id element when it is at the first position', (done) => {
      const doc = {
        _id: 'foo',
        field: 'bar'
      };
      unsubscribe = OpenInsertDocumentDialogStore.listen((hadronDoc) => {
        expect(hadronDoc.generateObject()).to.be.deep.equal({field: 'bar'});
        done();
      });
      OpenInsertDocumentDialogStore.openInsertDocumentDialog(doc, true);
    });
    it('removes the _id element when it is not at the first position', (done) => {
      const doc = {
        _a_surprise_: 'indeed',
        _id: 'foo',
        field: 'bar'
      };
      unsubscribe = OpenInsertDocumentDialogStore.listen((hadronDoc) => {
        expect(hadronDoc.generateObject()).to.be.deep.equal({
          _a_surprise_: 'indeed',
          field: 'bar'
        });
        done();
      });
      OpenInsertDocumentDialogStore.openInsertDocumentDialog(doc, true);
    });
  });
});
