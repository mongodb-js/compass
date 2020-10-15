import HadronDocument from 'hadron-document';

import {
  buildUpdateUnlessChangedInBackgroundQuery,
  getOriginalKeysAndValuesForFieldsThatWereUpdated,
  getSetUpdateForDocumentChanges,
  getUnsetUpdateForDocumentChanges
} from './document';

describe('document utils', () => {
  describe('#getSetUpdateForDocumentChanges', () => {
    context('when an element is removed', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).remove();
      });

      it('does not include the element in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({});
      });
    });

    context('when nothing is changed', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      it('returns an empty object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({});
      });
    });

    context('when an element is blank', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('');
      });

      it('does not include the element in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({});
      });
    });

    context('when an element is renamed', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('aa');
      });

      it('includes the element in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({
          aa: 'test'
        });
      });
    });

    context('when a nested element is edited', function() {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix'
        }
      };
      const doc = new HadronDocument(object);

      before(function() {
        doc.get('name').get('last').edit('aa');
      });

      it('includes the element in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({
          name: {
            first: 'jimmy',
            last: 'aa'
          }
        });
      });
    });

    context('when a nested element is renamed', function() {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix'
        }
      };
      const doc = new HadronDocument(object);

      before(function() {
        doc.get('name').get('last').rename('aa');
      });

      it('includes the element in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({
          name: {
            first: 'jimmy',
            aa: 'hendrix'
          }
        });
      });
    });

    context('when an element is named empty string', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('');
      });

      it('does not include the change in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({ });
      });
    });

    context('when an added element is named empty string', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.insertEnd('aa', '333');
        doc.elements.at(1).rename('');
      });

      it('does not include the change in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({ });
      });
    });

    context('when an element is added', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(() => {
        doc.insertEnd('pineapple', 'hat');
      });

      it('includes the change in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({
          pineapple: 'hat'
        });
      });
    });

    context('when a nested element is removed', function() {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix'
        }
      };
      const doc = new HadronDocument(object);

      before(function() {
        doc.get('name').get('last').remove();
      });

      it('does includes the top level element in the object', function() {
        expect(getSetUpdateForDocumentChanges(doc)).to.deep.equal({
          name: {
            first: 'jimmy'
          }
        });
      });
    });

    context('when the document is undefined', function() {
      it('returns an empty object', function() {
        expect(getSetUpdateForDocumentChanges(undefined)).to.deep.equal({});
      });
    });
  });

  describe('#getUnsetUpdateForDocumentChanges', () => {
    context('when an element is removed', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).remove();
      });

      it('includes the key in the object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({
          name: true
        });
      });
    });

    context('when nothing is changed', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      it('returns an empty object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({});
      });
    });

    context('when an element is renamed empty string', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('');
      });

      it('has the original key in the object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({
          name: true
        });
      });
    });

    context('when an added element is named empty string', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.insertEnd('aa', '333');
        doc.elements.at(1).rename('');
      });

      it('does not include the change in the object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({ });
      });
    });

    context('when an element is added', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(() => {
        doc.insertEnd('pineapple', 'hat');
      });

      it('does not have any change in the object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({ });
      });
    });

    context('when an element is renamed', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('aa');
      });

      it('includes the original key in the object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({
          name: true
        });
      });
    });

    context('when a nested element is edited', function() {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix'
        }
      };
      const doc = new HadronDocument(object);

      before(function() {
        doc.get('name').get('last').edit('aa');
      });

      it('returns empty object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({});
      });
    });

    context('when a nested element is removed', function() {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix'
        }
      };
      const doc = new HadronDocument(object);

      before(function() {
        doc.get('name').get('last').remove();
      });

      it('does not include the element in the object', function() {
        expect(getUnsetUpdateForDocumentChanges(doc)).to.deep.equal({});
      });
    });

    context('when the document is undefined', function() {
      it('returns an empty object', function() {
        expect(getUnsetUpdateForDocumentChanges(undefined)).to.deep.equal({});
      });
    });
  });

  describe('#getOriginalKeysAndValuesForFieldsThatWereUpdated', () => {
    context('when an element is removed', function() {
      const object = { name: 'test', another: 'ok' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).remove();
      });

      it('includes the key in the object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({
          name: 'test'
        });
      });
    });

    context('when nothing is changed', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      it('returns an empty object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({});
      });
    });

    context('when an element named to empty string', function() {
      const object = { name: 'test', another: 'ok' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('');
      });

      it('includes the original in the object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({
          name: 'test'
        });
      });
    });

    context('when an element is renamed', function() {
      const object = { name: 'test', another: 'ok' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('aa');
      });

      it('includes the original in the object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({
          name: 'test'
        });
      });
    });

    context('when a nested element is edited', function() {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix'
        },
        other: 'ok'
      };
      const doc = new HadronDocument(object);

      before(function() {
        doc.get('name').get('last').edit('aa');
      });

      it('returns the original element in the object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({
          name: {
            first: 'jimmy',
            last: 'hendrix'
          }
        });
      });
    });

    context('when an element is renamed empty string', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.elements.at(0).rename('');
      });

      it('includes the change in the object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({
          name: 'test'
        });
      });
    });

    context('when an added element is named empty string', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(function() {
        doc.insertEnd('aa', '333');
        doc.elements.at(1).rename('');
      });

      it('does not have any element in the object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({ });
      });
    });

    context('when an element is added', function() {
      const object = { name: 'test' };
      const doc = new HadronDocument(object);

      before(() => {
        doc.insertEnd('pineapple', 'hat');
      });

      it('includes a check that the new element doesnt exist or exists with the same value', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({
          pineapple: {
            $exists: false
          }
        });
      });
    });

    context('when a nested element is removed', function() {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix'
        },
        test: 'ok'
      };
      const doc = new HadronDocument(object);

      before(function() {
        doc.get('name').get('last').remove();
      });

      it('returns the original element in the object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(doc)).to.deep.equal({
          name: {
            first: 'jimmy',
            last: 'hendrix'
          }
        });
      });
    });

    context('when the document is undefined', function() {
      it('returns an empty object', function() {
        expect(getOriginalKeysAndValuesForFieldsThatWereUpdated(undefined)).to.deep.equal({});
      });
    });
  });

  describe('#buildUpdateUnlessChangedInBackgroundQuery', function() {
    context('when called with an edited document', function() {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      hadronDoc.get('name').edit('Desert Sand');

      it('has the original value for the edited value in the query', () => {
        const {
          query
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(query).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand'
        });
      });

      it('has the new value in the update doc', () => {
        const {
          updateDoc
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(updateDoc).to.deep.equal({
          $set: {
            name: 'Desert Sand'
          }
        });
      });
    });

    context('when an element has been renamed', function() {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      hadronDoc.get('name').edit('Desert Sand');
      hadronDoc.get('name').rename('newname');

      it('has the original value for the edited value in the query', () => {
        const {
          query
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(query).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand'
        });
      });

      it('has the new value in the update doc', () => {
        const {
          updateDoc
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(updateDoc).to.deep.equal({
          $set: {
            newname: 'Desert Sand'
          },
          $unset: {
            name: true
          }
        });
      });
    });

    context('when a nested element has been updated in the document', function() {
      const doc = { _id: 'testing', a: { nestedField1: 5, nestedField2: 'aaa' } };
      const hadronDoc = new HadronDocument(doc);
      hadronDoc.get('a').get('nestedField1').edit(10);

      it('has the original value for the edited value in the query', () => {
        const {
          query
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(query).to.deep.equal({
          _id: 'testing',
          a: { nestedField1: 5, nestedField2: 'aaa' }
        });
      });

      it('has the new value in the update doc', () => {
        const {
          updateDoc
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(updateDoc).to.deep.equal({
          $set: {
            a: { nestedField1: 10, nestedField2: 'aaa' }
          }
        });
      });
    });

    context('when a nested element has been renamed in the document', function() {
      const doc = { _id: 'testing', a: { nestedField1: 5, bbb: 'vvv' } };
      const hadronDoc = new HadronDocument(doc);
      hadronDoc.get('a').get('nestedField1').rename('newname');

      it('has the original value for the edited value in the query', () => {
        const {
          query
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(query).to.deep.equal({
          _id: 'testing',
          a: { nestedField1: 5, bbb: 'vvv' }
        });
      });

      it('has the new value in the update doc', () => {
        const {
          updateDoc
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(updateDoc).to.deep.equal({
          $set: {
            a: { newname: 5, bbb: 'vvv' }
          }
        });
      });
    });

    context('when a nested element has been removed in the document', function() {
      const doc = { _id: 'testing', a: { nestedField1: 5, nestedField2: 'aaa' } };
      const hadronDoc = new HadronDocument(doc);
      hadronDoc.get('a').get('nestedField1').remove();

      it('has the original value for the edited value in the query', () => {
        const {
          query
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(query).to.deep.equal({
          _id: 'testing',
          a: { nestedField1: 5, nestedField2: 'aaa' }
        });
      });

      it('has the new value in the update doc', () => {
        const {
          updateDoc
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(updateDoc).to.deep.equal({
          $set: {
            a: { nestedField2: 'aaa' }
          }
        });
      });
    });

    context('when called with a document with no edits', function() {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);

      it('has only the _id in the query', () => {
        const {
          query
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(query).to.deep.equal({
          _id: 'testing'
        });
      });

      it('has an empty update document', () => {
        const {
          updateDoc
        } = buildUpdateUnlessChangedInBackgroundQuery(hadronDoc);

        expect(updateDoc).to.deep.equal({ });
      });
    });
  });
});
