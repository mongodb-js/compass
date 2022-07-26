import { expect } from 'chai';
import Document from '../src/';
import SharedExamples from './shared-examples';
import { ObjectId, Long, Int32, Double } from 'bson';

describe('Document', function () {
  describe('#get', function () {
    context('when the element exists for the key', function () {
      const doc = new Document({ name: 'test' });

      it('returns the element', function () {
        expect(doc.get('name')?.currentValue).to.equal('test');
      });
    });

    context('when the element is deleted', function () {
      const doc = new Document({});
      const element = doc.insertEnd('name', 'test');

      before(function () {
        element.remove();
      });

      it('returns undefined', function () {
        expect(doc.get('test')).to.equal(undefined);
      });
    });

    context('when the element field is changed', function () {
      const doc = new Document({ name: 'test' });
      const element = doc.elements.at(0);

      before(function () {
        element?.rename('testing');
      });

      it('returns the element for the new key', function () {
        expect(doc.get('testing')).to.equal(element);
      });

      it('returns undefined for the original key', function () {
        expect(doc.get('name')).to.equal(undefined);
      });
    });

    context('when the element does not exist for the key', function () {
      const doc = new Document({ name: 'test' });

      it('returns undefined', function () {
        expect(doc.get('test')).to.equal(undefined);
      });
    });
  });

  describe('#getChild', function () {
    const doc = new Document({
      array: ['1', [['1', ['inner array']]]],
      object: { a: { b: { c: { d: 'inner object' } } } },
      mixed: { a: [{ b: ['abc', { c: 'inner mixed' }] }] },
    });
    context('when path is empty', function () {
      it('returns undefined', function () {
        expect(doc.getChild([])).to.equal(undefined);
      });
    });
    context('when the path does not exist', function () {
      it('returns undefined for top level', function () {
        expect(doc.getChild(['not there'])).to.equal(undefined);
      });
      it('returns undefined for object', function () {
        expect(doc.getChild(['object', 'not there'])).to.equal(undefined);
      });
      it('returns undefined for array', function () {
        expect(doc.getChild(['array', 'not there'])).to.equal(undefined);
      });
      it('returns undefined for index too large', function () {
        expect(doc.getChild(['array', 3])).to.equal(undefined);
      });
    });
    context('when the path is too long', function () {
      it('returns undefined', function () {
        expect(
          doc.getChild(['mixed', 'a', 0, 'b', 1, 'c', 'not there'])
        ).to.equal(undefined);
      });
    });
    context('indexing only into arrays', function () {
      it('returns the deepest element', function () {
        const element = doc.getChild(['array', 1, 0, 1, 0]);
        expect(element?.value).to.equal('inner array');
      });
      it('returns a  middle element', function () {
        const element = doc.getChild(['array', 1, 0]);
        expect(element?.currentType).to.equal('Array');
        expect(element?.generateObject()).to.deep.equal(['1', ['inner array']]);
      });
    });
    context('indexing only into objects', function () {
      it('returns the deepest element', function () {
        const element = doc.getChild(['object', 'a', 'b', 'c', 'd']);
        expect(element?.value).to.equal('inner object');
      });
      it('returns a  middle element', function () {
        const element = doc.getChild(['object', 'a', 'b']);
        expect(element?.currentType).to.equal('Object');
        expect(element?.generateObject()).to.deep.equal({
          c: { d: 'inner object' },
        });
      });
    });
    context('indexing into mixed array and object', function () {
      it('returns the deepest element', function () {
        const element = doc.getChild(['mixed', 'a', 0, 'b', 1, 'c']);
        expect(element?.value).to.equal('inner mixed');
      });
      it('returns a  middle element', function () {
        const element = doc.getChild(['mixed', 'a', 0, 'b']);
        expect(element?.currentType).to.equal('Array');
        expect(element?.generateObject()).to.deep.equal([
          'abc',
          { c: 'inner mixed' },
        ]);
      });
    });
  });

  describe('#generateObject', function () {
    context('when nothing has been loaded', function () {
      const doc = new Document({ _id: 'abc' });

      it('generates the appropriate document', function () {
        expect(doc.generateObject()).to.deep.equal({ _id: 'abc' });
      });
    });

    context('when the list is partially loaded', function () {
      const doc = new Document({ _id: 'abc', name: 'test' });

      before(function () {
        for (const element of doc.elements) {
          expect(element.currentKey).to.equal('_id');
          break;
        }
      });

      it('generates the appropriate document', function () {
        expect(doc.generateObject()).to.deep.equal({
          _id: 'abc',
          name: 'test',
        });
      });
    });

    context('when adding to the document before iterating', function () {
      const doc = new Document({ _id: 'abc' });

      before(function () {
        doc.insertEnd('name', 'test');
      });

      it('generates the appropriate document', function () {
        expect(doc.generateObject()).to.deep.equal({
          _id: 'abc',
          name: 'test',
        });
      });
    });
  });

  describe('#generateOriginalObject', function () {
    context('with an unchanged document', function () {
      const doc = new Document({ _id: 'abc', name: 'test' });

      it('generates the appropriate document', function () {
        expect(doc.generateOriginalObject()).to.deep.equal({
          _id: 'abc',
          name: 'test',
        });
      });
    });

    context('when adding to the document before iterating', function () {
      const doc = new Document({ _id: 'abc' });

      before(function () {
        doc.insertEnd('name', 'test');
        doc.get('name')?.edit('test2');
        doc.insertEnd('name2', 'test22');
        doc.get('name')?.remove();
        doc.insertEnd('nestedArray', [
          {
            a: 3,
          },
          {
            c: 2,
          },
        ]);
      });

      it('generates the appropriate original document', function () {
        expect(doc.generateOriginalObject()).to.deep.equal({ _id: 'abc' });
      });
    });
  });

  describe('.insertEnd', function () {
    context('when the new element is a primitive value', function () {
      const doc = new Document({});

      before(function () {
        doc.insertEnd('name', 'Aphex Twin');
      });

      it('adds the new element', function () {
        expect(doc.elements.at(0)?.key).to.equal('name');
      });

      it('sets the new element value', function () {
        expect(doc.elements.at(0)?.value).to.equal('Aphex Twin');
      });

      it('flags the new element as added', function () {
        expect(doc.elements.at(0)?.isAdded()).to.equal(true);
      });
    });

    context('when the new embedded element is a document', function () {
      context('when setting directly', function () {
        before(function () {
          this.doc = new Document({});
          this.doc.insertEnd('email', { home: 'home@example.com' });
        });

        SharedExamples.itAddsTheEmbeddedDocumentElementToTheRootDocument();
      });

      context(
        'when adding the embedded document then the first element',
        function () {
          before(function () {
            this.doc = new Document({});
            this.doc
              .insertEnd('email', {})
              .insertEnd('home', 'home@example.com');
          });

          SharedExamples.itAddsTheEmbeddedDocumentElementToTheRootDocument();
        }
      );
    });

    context('when the embedded element is an array', function () {
      context('when setting directly', function () {
        before(function () {
          this.doc = new Document({});
          this.doc.insertEnd('emails', ['home@example.com']);
        });

        SharedExamples.itAddsTheArrayElementToTheRootDocument();
      });

      context('when adding the array and then the first element', function () {
        before(function () {
          this.doc = new Document({});
          this.doc.insertEnd('emails', []).insertEnd('', 'home@example.com');
        });

        SharedExamples.itAddsTheArrayElementToTheRootDocument();
      });
    });

    context(
      'when the embedded element is an array of embedded documents',
      function () {
        context('when setting directly', function () {
          before(function () {
            this.doc = new Document({});
            this.doc.insertEnd('emails', [{ home: 'home@example.com' }]);
          });

          SharedExamples.itAddsTheEmbeddedArrayElementToTheRootDocument();
        });

        context(
          'when adding the array and then the first element',
          function () {
            before(function () {
              this.doc = new Document({});
              this.doc
                .insertEnd('emails', [])
                .insertEnd('', {})
                .insertEnd('home', 'home@example.com');
            });

            SharedExamples.itAddsTheEmbeddedArrayElementToTheRootDocument();
          }
        );
      }
    );
  });

  describe('#getId', function () {
    context('when the document has an _id element', function () {
      const doc = new Document({ name: 'test', _id: 'testing' });

      it('returns the _id', function () {
        expect(doc.getId()).to.equal('testing');
      });
    });

    context('when the document has no _id element', function () {
      const doc = new Document({ name: 'test' });

      it('returns null', function () {
        expect(doc.getId()).to.equal(null);
      });
    });

    context('when the _id is an object', function () {
      const doc = new Document({ _id: { name: 'test' } });

      it('returns null', function () {
        expect(doc.getId()).to.deep.equal({ name: 'test' });
      });
    });
  });

  describe('#getQueryForOriginalKeysAndValuesForSpecifiedFields', function () {
    context('when an element is removed', function () {
      const object = { name: 'test', ignored: 'ignored' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.remove();
      });

      it('includes the element in the object', function () {
        expect(
          doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys({
            alwaysIncludeKeys: [['name']],
          })
        ).to.deep.equal({ name: 'test' });
      });
    });

    context('when nothing is changed', function () {
      const object = { name: 'test', ignored: 'ignored' };
      const doc = new Document(object);

      it('includes the element in the object', function () {
        expect(
          doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys({
            alwaysIncludeKeys: [['name']],
          })
        ).to.deep.equal({ name: 'test' });
      });
    });

    context('when an element is blank', function () {
      const object = { name: 'test', ignored: 'ignored' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('');
      });

      it('includes the element in the object', function () {
        expect(
          doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys({
            alwaysIncludeKeys: [['name']],
          })
        ).to.deep.equal({ name: 'test' });
      });
    });

    context('when an element is renamed', function () {
      const object = { name: 'test', ignored: 'ignored' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('aa');
      });

      it('includes the element in the object', function () {
        expect(
          doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys({
            alwaysIncludeKeys: [['name']],
          })
        ).to.deep.equal({ name: 'test' });
      });
    });

    context('when an element is updated', function () {
      const object = { name: 'test', ignored: 'ignored' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.edit('aa');
      });

      it('includes the element in the object', function () {
        expect(
          doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys({
            alwaysIncludeKeys: [['name']],
          })
        ).to.deep.equal({ name: 'test' });
      });
    });
  });

  describe('#getStringId', function () {
    context('when the document has no _id element', function () {
      const doc = new Document({ name: 'test' });

      it('returns null', function () {
        expect(doc.getStringId()).to.equal(null);
      });
    });

    context('when the _id is a string', function () {
      const doc = new Document({ name: 'test', _id: 'testing' });

      it('returns the _id', function () {
        expect(doc.getStringId()).to.equal('testing');
      });
    });

    context('when the _id is an objectId', function () {
      const oid = new ObjectId();
      const doc = new Document({ _id: oid });

      it('returns null', function () {
        expect(doc.getStringId()).to.equal(oid.toString());
      });
    });

    context('when the _id is a number', function () {
      const doc = new Document({ _id: 5 });

      it('returns null', function () {
        expect(doc.getStringId()).to.equal('5');
      });
    });

    context('when the _id is an array', function () {
      const doc = new Document({ _id: [1, 2, 3] });

      it('returns null', function () {
        expect(doc.getStringId()).to.equal('[1,2,3]');
      });
    });

    context('when the _id is an object', function () {
      const doc = new Document({ _id: { test: 'value' } });

      it('returns null', function () {
        expect(doc.getStringId()).to.equal('{"test":"value"}');
      });
    });
  });

  describe('.new', function () {
    context('when the document is flat', function () {
      const object = { name: 'Aphex Twin' };
      const doc = new Document(object);

      it('creates the element', function () {
        expect(doc.elements.size).to.equal(1);
      });

      it('sets the element original key', function () {
        expect(doc.elements.at(0)?.key).to.equal('name');
      });

      it('sets the element current key', function () {
        expect(doc.elements.at(0)?.currentKey).to.equal('name');
      });

      it('sets the element original value', function () {
        expect(doc.elements.at(0)?.value).to.equal('Aphex Twin');
      });

      it('sets the element current value', function () {
        expect(doc.elements.at(0)?.currentValue).to.equal('Aphex Twin');
      });
    });

    context('when the document has arrays', function () {
      const object = { studios: ['London', 'New York'] };
      const doc = new Document(object);

      it('creates the element', function () {
        expect(doc.elements.size).to.equal(1);
      });

      it('sets the element original key', function () {
        expect(doc.elements.at(0)?.key).to.equal('studios');
      });

      it('sets the element current key', function () {
        expect(doc.elements.at(0)?.currentKey).to.equal('studios');
      });

      it('sets the element indexes', function () {
        expect(doc.elements.at(0)?.elements?.at(0)?.key).to.equal(0);
        expect(doc.elements.at(0)?.elements?.at(1)?.key).to.equal(1);
      });

      it('sets the element original values', function () {
        expect(doc.elements.at(0)?.elements?.at(0)?.value).to.equal('London');
        expect(doc.elements.at(0)?.elements?.at(1)?.value).to.equal('New York');
      });

      it('sets the element current values', function () {
        expect(doc.elements.at(0)?.elements?.at(0)?.currentValue).to.equal(
          'London'
        );
        expect(doc.elements.at(0)?.elements?.at(1)?.currentValue).to.equal(
          'New York'
        );
      });
    });

    context('when the document has children', function () {
      context('when the document has an embedded document', function () {
        const object = { email: { work: 'test@example.com' } };
        const doc = new Document(object);

        it('creates the element', function () {
          expect(doc.elements.size).to.equal(1);
        });

        it('sets the element original key', function () {
          expect(doc.elements.at(0)?.key).to.equal('email');
        });

        it('sets the element current key', function () {
          expect(doc.elements.at(0)?.currentKey).to.equal('email');
        });

        it('sets the embedded element key', function () {
          expect(doc.elements.at(0)?.elements?.at(0)?.key).to.equal('work');
          expect(doc.elements.at(0)?.elements?.at(0)?.currentKey).to.equal(
            'work'
          );
        });

        it('sets the embedded element original value', function () {
          expect(doc.elements.at(0)?.elements?.at(0)?.value).to.equal(
            'test@example.com'
          );
        });

        it('sets the embedded element current value', function () {
          expect(doc.elements.at(0)?.elements?.at(0)?.currentValue).to.equal(
            'test@example.com'
          );
        });
      });

      context(
        'when the document has multi level embedded documents',
        function () {
          const object = { contact: { email: { work: 'test@example.com' } } };
          const doc = new Document(object);

          it('creates the element', function () {
            expect(doc.elements.size).to.equal(1);
          });

          it('sets the element original key', function () {
            expect(doc.elements.at(0)?.key).to.equal('contact');
          });

          it('sets the embedded element key', function () {
            expect(doc.elements.at(0)?.elements?.at(0)?.key).to.equal('email');
          });

          it('sets the multi embedded element key', function () {
            expect(
              doc.elements.at(0)?.elements?.at(0)?.elements?.at(0)?.key
            ).to.equal('work');
          });

          it('sets the embedded element original value', function () {
            expect(
              doc.elements.at(0)?.elements?.at(0)?.elements?.at(0)?.value
            ).to.equal('test@example.com');
          });
        }
      );

      context(
        'when the document has an array of embedded documents',
        function () {
          const object = { emails: [{ work: 'test@example.com' }] };
          const doc = new Document(object);

          it('creates the element', function () {
            expect(doc.elements.size).to.equal(1);
          });

          it('sets the element original key', function () {
            expect(doc.elements.at(0)?.key).to.equal('emails');
          });

          it('sets the embedded element key', function () {
            expect(doc.elements.at(0)?.elements?.at(0)?.key).to.equal(0);
          });

          it('sets the multi embedded element key', function () {
            expect(
              doc.elements.at(0)?.elements?.at(0)?.elements?.at(0)?.key
            ).to.equal('work');
          });

          it('sets the embedded element original value', function () {
            expect(
              doc.elements.at(0)?.elements?.at(0)?.elements?.at(0)?.value
            ).to.equal('test@example.com');
          });
        }
      );

      context(
        'when the document has an embedded array of embedded documents',
        function () {
          const object = {
            contact: { emails: [{ work: 'test@example.com' }] },
          };
          const doc = new Document(object);

          it('creates the element', function () {
            expect(doc.elements.size).to.equal(1);
          });

          it('sets the element original key', function () {
            expect(doc.elements.at(0)?.key).to.equal('contact');
          });

          it('sets the embedded element key', function () {
            expect(doc.elements.at(0)?.elements?.at(0)?.key).to.equal('emails');
          });

          it('sets the multi embedded element key', function () {
            expect(
              doc.elements.at(0)?.elements?.at(0)?.elements?.at(0)?.key
            ).to.equal(0);
          });

          it('sets the lowest level embedded element key', function () {
            expect(
              doc.elements
                .at(0)
                ?.elements?.at(0)
                ?.elements?.at(0)
                ?.elements?.at(0)?.key
            ).to.equal('work');
          });

          it('sets the embedded element original value', function () {
            expect(
              doc.elements
                .at(0)
                ?.elements?.at(0)
                ?.elements?.at(0)
                ?.elements?.at(0)?.value
            ).to.equal('test@example.com');
          });
        }
      );
    });
  });

  context('#cancel', function () {
    const object = {
      root: 'value',
      childArray: [1, 2, 3],
      childObject: { test: 'value' },
    };
    const doc = new Document(object);
    const root = doc.elements.at(0);
    const childArray = doc.elements.at(1);
    const childObject = doc.elements.at(2);

    before(function () {
      root?.edit('value edit');
      childArray?.elements?.at(2)?.remove();
      childObject?.insertEnd('new', 'value');
      doc.cancel();
    });

    it('resets edited elements', function () {
      expect(root?.currentValue).to.equal('value');
    });

    it('resets deleted elements', function () {
      expect(childArray?.elements?.size).to.equal(3);
    });

    it('removes added elements', function () {
      expect(childObject?.elements?.size).to.equal(1);
    });
  });

  describe('#generateUpdateUnlessChangedInBackgroundQuery: query', function () {
    context('when called with an edited document', function () {
      const doc = { _id: 'testing', name: 'Beach Sand', yes: 'no' };
      const hadronDoc = new Document(doc);
      hadronDoc.get('name')?.edit('Desert Sand');

      it('has the original value for the edited value in the query', function () {
        const { query } =
          hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

        expect(query).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand',
        });
      });

      it('contains keys that were explicitly requested', function () {
        const { query } =
          hadronDoc.generateUpdateUnlessChangedInBackgroundQuery({
            alwaysIncludeKeys: [['yes']],
          });

        expect(query).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand',
          yes: 'no',
        });
      });

      it('has the new value in the update doc', function () {
        const { updateDoc } =
          hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

        expect(updateDoc).to.deep.equal({
          $set: {
            name: 'Desert Sand',
          },
        });
      });
    });

    context('when an element has been renamed', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new Document(doc);
      hadronDoc.get('name')?.edit('Desert Sand');
      hadronDoc.get('name')?.rename('newname');

      it('has the original value for the edited value in the query', function () {
        const { query } =
          hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

        expect(query).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand',
          newname: { $exists: false },
        });
      });

      it('has the new value in the update doc', function () {
        const { updateDoc } =
          hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

        expect(updateDoc).to.deep.equal({
          $set: {
            newname: 'Desert Sand',
          },
          $unset: {
            name: true,
          },
        });
      });
    });

    context(
      'when a nested element has been updated in the document',
      function () {
        const doc = {
          _id: 'testing',
          a: { nestedField1: 'abc', nestedField2: 'aaa' },
        };
        const hadronDoc = new Document(doc);
        hadronDoc.get('a')?.get('nestedField1')?.edit('cba');

        it('has the original value for the edited value in the query', function () {
          const { query } =
            hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

          expect(query).to.deep.equal({
            _id: 'testing',
            'a.nestedField1': 'abc',
          });
        });

        it('has the new value in the update doc', function () {
          const { updateDoc } =
            hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

          expect(updateDoc).to.deep.equal({
            $set: {
              'a.nestedField1': 'cba',
            },
          });
        });
      }
    );

    context(
      'when a nested element has been renamed in the document',
      function () {
        const doc = { _id: 'testing', a: { nestedField1: 'abc', bbb: 'vvv' } };
        const hadronDoc = new Document(doc);
        hadronDoc.get('a')?.get('nestedField1')?.rename('newname');

        it('has the original value for the edited value in the query', function () {
          const { query } =
            hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

          expect(query).to.deep.equal({
            _id: 'testing',
            'a.nestedField1': 'abc',
            'a.newname': { $exists: false },
          });
        });

        it('has the new value in the update doc', function () {
          const { updateDoc } =
            hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

          expect(updateDoc).to.deep.equal({
            $set: {
              'a.newname': 'abc',
            },
            $unset: {
              'a.nestedField1': true,
            },
          });
        });
      }
    );

    context(
      'when a nested element has been removed in the document',
      function () {
        const doc = {
          _id: 'testing',
          a: { nestedField1: 'abc', nestedField2: 'aaa' },
        };
        const hadronDoc = new Document(doc);
        hadronDoc.get('a')?.get('nestedField1')?.remove();

        it('has the original value for the edited value in the query', function () {
          const { query } =
            hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

          expect(query).to.deep.equal({
            _id: 'testing',
            'a.nestedField1': 'abc',
          });
        });

        it('has the new value in the update doc', function () {
          const { updateDoc } =
            hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

          expect(updateDoc).to.deep.equal({
            $unset: {
              'a.nestedField1': true,
            },
          });
        });
      }
    );

    context('when called with a document with no edits', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new Document(doc);

      it('has only the _id in the query', function () {
        const { query } =
          hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

        expect(query).to.deep.equal({
          _id: 'testing',
        });
      });

      it('has an empty update document', function () {
        const { updateDoc } =
          hadronDoc.generateUpdateUnlessChangedInBackgroundQuery();

        expect(updateDoc).to.deep.equal({});
      });
    });

    context('when an encrypted element has been updated', function () {
      const object = {
        name: 'test',
        ignored: 'ignored',
        [Symbol.for('@@mdb.decryptedKeys')]: ['name'],
      };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.edit('aa');
      });

      it('excludes the element from the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery()
        ).to.deep.equal({
          query: {
            _id: null,
          },
          updateDoc: {
            $set: {
              name: 'aa',
            },
          },
        });
      });

      it('includes the element in the object if requested', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery({
            includableEncryptedKeys: [['name']],
          })
        ).to.deep.equal({
          query: {
            _id: null,
            name: 'test',
          },
          updateDoc: {
            $set: {
              name: 'aa',
            },
          },
        });
      });
    });
  });

  describe('#getOriginalKeysAndValuesForFieldsThatWereUpdated', function () {
    context('when an element is removed', function () {
      const object = { name: 'test', another: 'ok' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.remove();
      });

      it('includes the key in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
          name: 'test',
        });
      });
    });

    context('when nothing is changed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      it('returns an empty object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
        });
      });
    });

    context('when an element named to empty string', function () {
      const object = { name: 'test', another: 'ok' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('');
      });

      it('includes the original in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
          name: 'test',
        });
      });
    });

    context('when an element is renamed', function () {
      const object = { name: 'test', another: 'ok' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('aa');
      });

      it('includes the original in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
          name: 'test',
          aa: { $exists: false },
        });
      });
    });

    context('when a nested element is edited', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
        other: 'ok',
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.get('last')?.edit('aa');
      });

      it('returns the original element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
          'name.last': 'hendrix',
        });
      });
    });

    context('when an element is renamed empty string', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('');
      });

      it('includes the change in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
          name: 'test',
        });
      });
    });

    context('when an added element is named empty string', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.insertEnd('aa', '333');
        doc.elements.at(1)?.rename('');
      });

      it('does not have any element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
        });
      });
    });

    context('when an element is added', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.insertEnd('pineapple', 'hat');
      });

      it('includes a check that the new element doesnt exist or exists with the same value', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
          pineapple: {
            $exists: false,
          },
        });
      });
    });

    context('when a nested element is removed', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
        test: 'ok',
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.get('last')?.remove();
      });

      it('returns the original element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().query
        ).to.deep.equal({
          _id: null,
          'name.last': 'hendrix',
        });
      });
    });
  });

  describe('#generateUpdateUnlessChangedInBackgroundQuery: $set', function () {
    context('when an element is removed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.remove();
      });

      it('does not include the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.equal(undefined);
      });
    });

    context('when nothing is changed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      it('returns an empty object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.equal(undefined);
      });
    });

    context('when an element is blank', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('');
      });

      it('does not include the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.equal(undefined);
      });
    });

    context('when an element is renamed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('aa');
      });

      it('includes the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.deep.equal({
          aa: 'test',
        });
      });
    });

    context('when a nested element is edited', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.get('last')?.edit('aa');
      });

      it('includes the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.deep.equal({
          'name.last': 'aa',
        });
      });
    });

    context('when a nested element is renamed', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.get('last')?.rename('aa');
      });

      it('includes the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery()
        ).to.deep.equal({
          query: {
            _id: null,
            'name.aa': { $exists: false },
            'name.last': 'hendrix',
          },
          updateDoc: {
            $set: {
              'name.aa': 'hendrix',
            },
            $unset: {
              'name.last': true,
            },
          },
        });
      });
    });

    context('when an element is changed to a nested document', function () {
      const object = {
        name: 42,
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.changeType('Object');
        doc.get('name')?.insertEnd('first', 'jimmy');
        doc.get('name')?.insertEnd('last', 'hendrix');
      });

      it('includes the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery()
        ).to.deep.equal({
          query: {
            _id: null,
            name: new Int32(42),
          },
          updateDoc: {
            $set: {
              name: { first: 'jimmy', last: 'hendrix' },
            },
          },
        });
      });
    });

    context('when an element is changed from nested document', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.changeType('Int32');
        doc.get('name')?.edit(new Int32(42));
      });

      it('includes the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery()
        ).to.deep.equal({
          query: {
            _id: null,
            name: {
              first: 'jimmy',
              last: 'hendrix',
            },
          },
          updateDoc: {
            $set: {
              name: new Int32(42),
            },
          },
        });
      });
    });

    context('when an element is named empty string', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('');
      });

      it('does not include the change in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.equal(undefined);
      });
    });

    context('when an added element is named empty string', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.insertEnd('aa', '333');
        doc.elements.at(1)?.rename('');
      });

      it('does not include the change in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.equal(undefined);
      });
    });

    context('when an element is added', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.insertEnd('pineapple', 'hat');
      });

      it('includes the change in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.deep.equal({
          pineapple: 'hat',
        });
      });
    });

    context('when a nested element is removed', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.get('last')?.remove();
      });

      it('does includes the top level element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$set
        ).to.equal(undefined);
      });

      it('includes it in the unset part of the query', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.deep.equal({
          'name.last': true,
        });
      });
    });
  });

  describe('#generateUpdateUnlessChangedInBackgroundQuery: $unset', function () {
    context('when an element is removed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.remove();
      });

      it('includes the key in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.deep.equal({
          name: true,
        });
      });
    });

    context('when nothing is changed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      it('returns undefined', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.equal(undefined);
      });
    });

    context('when an element is renamed empty string', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('');
      });

      it('has the original key in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.deep.equal({
          name: true,
        });
      });
    });

    context('when an added element is named empty string', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.insertEnd('aa', '333');
        doc.elements.at(1)?.rename('');
      });

      it('does not include the change in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.equal(undefined);
      });
    });

    context('when an element is added', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.insertEnd('pineapple', 'hat');
      });

      it('does not have any change in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.equal(undefined);
      });
    });

    context('when an element is renamed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0)?.rename('aa');
      });

      it('includes the original key in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.deep.equal({
          name: true,
        });
      });
    });

    context('when two elements is renamed in a circular manner', function () {
      const object = { a: 'test1', b: 'test2' };
      const doc = new Document(object);

      before(function () {
        doc.elements.get('b')?.rename('c');
        doc.elements.get('a')?.rename('b');
      });

      it('generates the proper query and update for that situation', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery()
        ).to.deep.equal({
          query: { _id: null, b: 'test2', a: 'test1', c: { $exists: false } },
          updateDoc: {
            $set: { b: 'test1', c: 'test2' },
            $unset: { a: true },
          },
        });
      });
    });

    context(
      'when an element is renamed to the name of a removed element',
      function () {
        const object = { a: 'test1', b: 'test2' };
        const doc = new Document(object);

        before(function () {
          doc.elements.get('b')?.remove();
          doc.elements.get('a')?.rename('b');
        });

        it('generates the proper query and update for that situation', function () {
          expect(
            doc.generateUpdateUnlessChangedInBackgroundQuery()
          ).to.deep.equal({
            query: { _id: null, b: 'test2', a: 'test1' },
            updateDoc: {
              $set: { b: 'test1' },
              $unset: { a: true },
            },
          });
        });
      }
    );

    context('when a nested element is edited', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.get('last')?.edit('aa');
      });

      it('returns undefined', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.equal(undefined);
      });
    });

    context('when a nested element is removed', function () {
      const object = {
        name: {
          first: 'jimmy',
          last: 'hendrix',
        },
      };
      const doc = new Document(object);

      before(function () {
        doc.get('name')?.get('last')?.remove();
      });

      it('does not include the element in the object', function () {
        expect(
          doc.generateUpdateUnlessChangedInBackgroundQuery().updateDoc.$unset
        ).to.deep.equal({
          'name.last': true,
        });
      });
    });
  });

  describe('array modifications', function () {
    it('can add array elements', function () {
      const doc = new Document({
        a: [1, 2, 3],
      });
      doc.get('a')?.insertEnd(3, new Int32(4));
      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: { _id: null, 'a.3': { $exists: false } },
        updateDoc: { $set: { 'a.3': new Int32(4) } },
      });
    });
    it('can edit array elements', function () {
      const doc = new Document({
        a: [1, 2, 3],
      });
      doc.get('a')?.get(2)?.edit(new Int32(4));
      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: { _id: null, 'a.2': new Int32(3) },
        updateDoc: { $set: { 'a.2': new Int32(4) } },
      });
    });
    it('can insert array elements', function () {
      const doc = new Document({
        a: [1, 2, 3],
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      doc.get('a')?.insertAfter(doc.get('a')!.get(1)!, 2, new Int32(4));
      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: { _id: null, 'a.2': new Int32(3), 'a.3': { $exists: false } },
        updateDoc: { $set: { 'a.2': new Int32(4), 'a.3': new Int32(3) } },
      });
    });
    it('can remove array elements in the middle of the array', function () {
      const doc = new Document({
        a: [1, 2, 3],
      });
      doc.get('a')?.get(1)?.remove();
      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: {
          _id: null,
          a: [new Int32(1), new Int32(2), new Int32(3)],
        },
        updateDoc: {
          $set: { a: [new Int32(1), new Int32(3)] },
        },
      });
    });
    it('can remove array elements at the end of the array', function () {
      const doc = new Document({
        a: [1, 2, 3],
      });
      doc.get('a')?.get(2)?.remove();
      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: {
          _id: null,
          a: [new Int32(1), new Int32(2), new Int32(3)],
        },
        updateDoc: {
          $set: { a: [new Int32(1), new Int32(2)] },
        },
      });
    });
  });

  describe('dots & dollars', function () {
    it('can perform updates on fields containing dots', function () {
      const doc = new Document({
        'a.b': { 'c.d': 'x' },
      });

      doc.get('a.b')?.get('c.d')?.edit('y');

      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: {
          _id: null,
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $getField: {
                      field: { $literal: 'c.d' },
                      input: {
                        $getField: {
                          field: { $literal: 'a.b' },
                          input: '$$ROOT',
                        },
                      },
                    },
                  },
                  { $literal: 'x' },
                ],
              },
            ],
          },
        },
        updateDoc: [
          {
            $replaceWith: {
              $setField: {
                field: { $literal: 'a.b' },
                input: '$$ROOT',
                value: {
                  $setField: {
                    field: { $literal: 'c.d' },
                    input: {
                      $getField: {
                        field: { $literal: 'a.b' },
                        input: '$$ROOT',
                      },
                    },
                    value: { $literal: 'y' },
                  },
                },
              },
            },
          },
        ],
      });
    });

    it('can perform updates on fields containing dollars', function () {
      const doc = new Document({
        'a.b': { $foo: 'x' },
      });

      doc.get('a.b')?.get('$foo')?.edit('y');

      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: {
          _id: null,
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $getField: {
                      field: { $literal: '$foo' },
                      input: {
                        $getField: {
                          field: { $literal: 'a.b' },
                          input: '$$ROOT',
                        },
                      },
                    },
                  },
                  { $literal: 'x' },
                ],
              },
            ],
          },
        },
        updateDoc: [
          {
            $replaceWith: {
              $setField: {
                field: { $literal: 'a.b' },
                input: '$$ROOT',
                value: {
                  $setField: {
                    field: { $literal: '$foo' },
                    input: {
                      $getField: {
                        field: { $literal: 'a.b' },
                        input: '$$ROOT',
                      },
                    },
                    value: { $literal: 'y' },
                  },
                },
              },
            },
          },
        ],
      });
    });

    it('can rename fields containing dots and dollars', function () {
      const doc = new Document({
        'a.b': { $foo: 'x' },
      });

      doc.get('a.b')?.get('$foo')?.rename('$bar');

      expect(doc.generateUpdateUnlessChangedInBackgroundQuery()).to.deep.equal({
        query: {
          _id: null,
          $expr: {
            $and: [
              {
                $eq: [
                  {
                    $type: {
                      $getField: {
                        field: { $literal: '$bar' },
                        input: {
                          $getField: {
                            field: { $literal: 'a.b' },
                            input: '$$ROOT',
                          },
                        },
                      },
                    },
                  },
                  'missing',
                ],
              },
              {
                $eq: [
                  {
                    $getField: {
                      field: { $literal: '$foo' },
                      input: {
                        $getField: {
                          field: { $literal: 'a.b' },
                          input: '$$ROOT',
                        },
                      },
                    },
                  },
                  { $literal: 'x' },
                ],
              },
            ],
          },
        },
        updateDoc: [
          {
            $replaceWith: {
              $setField: {
                field: { $literal: 'a.b' },
                input: '$$ROOT',
                value: {
                  $setField: {
                    field: { $literal: '$bar' },
                    input: {
                      $getField: {
                        field: { $literal: 'a.b' },
                        input: '$$ROOT',
                      },
                    },
                    value: { $literal: 'x' },
                  },
                },
              },
            },
          },
          {
            $replaceWith: {
              $setField: {
                field: { $literal: 'a.b' },
                input: '$$ROOT',
                value: {
                  $setField: {
                    field: { $literal: '$foo' },
                    input: {
                      $getField: {
                        field: { $literal: 'a.b' },
                        input: '$$ROOT',
                      },
                    },
                    value: '$$REMOVE',
                  },
                },
              },
            },
          },
        ],
      });
    });
  });

  /**
   * Functional test that mirros the mockups for the document edit screen.
   */
  context('when editing an existing document', function () {
    const object = {
      address: {
        postal_code: '72550',
      },
      email: 'test@example.com',
      members: ['Richard James'],
      albums: [{ name: 'Syro' }],
      label: 'Warp',
    };
    const doc = new Document(object);
    const address = doc.elements.at(0);
    const postalCode = address?.elements?.at(0);
    const email = doc.elements.at(1);
    const label = doc.elements.at(4);

    it('sets the postal code edit', function () {
      postalCode?.edit(72550);
      expect(postalCode?.value).to.equal('72550');
      expect(postalCode?.currentValue).to.equal(72550);
      expect(postalCode?.isEdited()).to.equal(true);
    });

    it('adds the state to the address', function () {
      const state = address?.insertEnd('state', 'CA');
      expect(state?.key).to.equal('state');
      expect(state?.value).to.equal('CA');
      expect(state?.isAdded()).to.equal(true);
    });

    it('changes the email to an embedded document', function () {
      email?.rename('emails');
      email?.edit({});
      expect(email?.key).to.equal('email');
      expect(email?.currentKey).to.equal('emails');
      expect(email?.elements?.size).to.equal(0);
    });

    it('adds the home email element', function () {
      const home = email?.insertEnd('home', 'home@example.com');
      expect(email?.elements?.size).to.equal(1);
      expect(home?.key).to.equal('home');
      expect(home?.value).to.equal('home@example.com');
      expect(home?.isAdded()).to.equal(true);
    });

    it('adds the work email element', function () {
      const work = email?.insertEnd('work', 'work@example.com');
      expect(email?.elements?.size).to.equal(2);
      expect(work?.key).to.equal('work');
      expect(work?.value).to.equal('work@example.com');
      expect(work?.isAdded()).to.equal(true);
    });

    it('generates an update object', function () {
      label?.remove();
      expect(doc.generateObject()).to.deep.equal({
        address: {
          postal_code: 72550,
          state: 'CA',
        },
        emails: {
          home: 'home@example.com',
          work: 'work@example.com',
        },
        members: ['Richard James'],
        albums: [{ name: 'Syro' }],
      });
    });
  });

  context('when iterating the elements', function () {
    context('when iterating fully', function () {
      context('when the elements are not loaded', function () {
        const doc = { f1: 'v1', f2: 'v2', f3: 'v3' };
        const hadronDoc = new Document(doc);
        const elements = hadronDoc.elements;

        it('lazy loads all the elements in the list', function () {
          let i = 1;
          for (const element of elements) {
            expect(element.currentKey).to.equal(`f${i}`);
            expect(element.currentValue).to.equal(`v${i}`);
            i++;
          }
        });

        it('sets the proper size', function () {
          expect(elements.size).to.equal(3);
        });
      });

      context('when the elements are loaded', function () {
        const doc = { f1: 'v1', f2: 'v2', f3: 'v3' };
        const hadronDoc = new Document(doc);
        const elements = hadronDoc.elements;

        it('iterates all the elements in the list', function () {
          let i = 1;
          for (const element of elements) {
            expect(element.currentKey).to.equal(`f${i}`);
            expect(element.currentValue).to.equal(`v${i}`);
            i++;
          }
        });

        it('sets the proper size', function () {
          expect(elements.size).to.equal(3);
        });
      });
    });

    context('when flushing mid iteration', function () {
      const doc = { f1: 'v1', f2: 'v2', f3: 'v3' };
      const hadronDoc = new Document(doc);
      const elements = hadronDoc.elements;

      it('gets all the elements', function () {
        let index = 1;
        for (const element of elements) {
          expect(element.currentKey).to.equal(`f${index}`);
          index += 1;
        }
      });
    });

    context('when iterating partially', function () {
      const doc = { f1: 'v1', f2: 'v2', f3: 'v3' };
      const hadronDoc = new Document(doc);
      const elements = hadronDoc.elements;

      before(function () {
        for (const element of elements) {
          if (element !== null) {
            break;
          }
        }
      });

      it('keeps the correct size', function () {
        expect(elements.size).to.equal(3);
      });

      context('when iterating again', function () {
        it('lazy loads the remaining elements', function () {
          let i = 1;
          for (const element of elements) {
            expect(element.currentKey).to.equal(`f${i}`);
            expect(element.currentValue).to.equal(`v${i}`);
            i++;
          }
        });

        it('sets the proper size', function () {
          expect(elements.size).to.equal(3);
        });
      });
    });
  });

  describe('EJSON', function () {
    describe('Document.FromJSON', function () {
      it('parses strings in EJSON strict mode', function () {
        const parsed = Document.FromEJSON('{"a": 1}');
        expect(parsed.get('a')?.currentType).to.equal('Int32');
      });
    });

    describe('Document.FromJSONArray', function () {
      it('parses arrays', function () {
        const parsed = Document.FromEJSONArray('[{"a": 1}]');
        expect(parsed).to.have.lengthOf(1);
        expect(parsed[0].get('a')?.currentType).to.equal('Int32');
      });

      it('lifts single objects to a singleton arrays', function () {
        const parsed = Document.FromEJSONArray('{"a": 1}');
        expect(parsed).to.have.lengthOf(1);
        expect(parsed[0].get('a')?.currentType).to.equal('Int32');
      });
    });

    describe('#toEJSON', function () {
      it('handles null values', function () {
        const doc = new Document({
          a: 1,
          b: { foo: 2 },
          null_val: null,
        });
        expect(doc.toEJSON('current', { indent: undefined })).to.equal(
          '{"a":1,"b":{"foo":2},"null_val":null}'
        );
      });

      it('serializes Int32/Double as relaxed but not Int64', function () {
        const doc = new Document({
          a: 1,
          b: 1.5,
          c: Long.fromNumber(2),
        });
        expect(doc.toEJSON('current', { indent: undefined })).to.equal(
          '{"a":1,"b":1.5,"c":{"$numberLong":"2"}}'
        );
      });

      it('optionally serializes the current or the original document', function () {
        const doc = new Document({
          a: 1,
          b: 1.5,
          c: Long.fromNumber(2),
        });
        doc.get('a')?.edit(2);
        expect(doc.toEJSON('current', { indent: undefined })).to.equal(
          '{"a":2,"b":1.5,"c":{"$numberLong":"2"}}'
        );
        expect(doc.toEJSON('original', { indent: undefined })).to.equal(
          '{"a":1,"b":1.5,"c":{"$numberLong":"2"}}'
        );
      });

      it('allows specifying JSON indent', function () {
        const doc = new Document({ a: 1 });
        expect(doc.toEJSON('current', { indent: '>' })).to.equal(
          '{\n>"a": 1\n}'
        );
      });

      it('handles oddball floating point values', function () {
        const doc = new Document({
          negzero: new Double(-0),
          int: new Int32(1),
          inf: Infinity,
          ninf: -Infinity,
          nan: NaN,
        });
        expect(doc.toEJSON('current', { indent: undefined })).to.equal(
          '{' +
            [
              '"negzero":{"$numberDouble":"-0.0"},',
              '"int":1,',
              '"inf":{"$numberDouble":"Infinity"},',
              '"ninf":{"$numberDouble":"-Infinity"},',
              '"nan":{"$numberDouble":"NaN"}',
            ].join('') +
            '}'
        );
      });
    });
  });
});
