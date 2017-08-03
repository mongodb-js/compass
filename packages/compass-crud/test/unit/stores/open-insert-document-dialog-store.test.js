const { expect } = require('chai');
const OpenInsertDocumentDialogStore = require('../../../lib/stores/open-insert-document-dialog-store');

describe('OpenInsertDocumentDialogStore', () => {
  describe('#openInsertDocumentDialog', () => {
    const doc = { _id: 1, name: 'test' };

    context('when clone is true', () => {
      it('removes _id from the document', (done) => {
        const unsubscribe = OpenInsertDocumentDialogStore.listen((d) => {
          expect(d.elements.at(0).key).to.equal('name');
          unsubscribe();
          done();
        });

        OpenInsertDocumentDialogStore.open(doc, true);
      });
    });

    context('when clone is false', () => {
      it('does not remove _id from the document', (done) => {
        const unsubscribe = OpenInsertDocumentDialogStore.listen((d) => {
          expect(d.elements.at(0).key).to.equal('_id');
          unsubscribe();
          done();
        });

        OpenInsertDocumentDialogStore.open(doc, false);
      });
    });
  });
});
