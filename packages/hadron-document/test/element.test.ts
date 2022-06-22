import {
  ObjectId,
  Binary,
  Code,
  MaxKey,
  MinKey,
  Timestamp,
  Int32,
  Long,
  Double,
  Decimal128,
} from 'bson';
import { expect } from 'chai';
import { Document, Element } from '../src/';
import { DATE_FORMAT } from '../src/element';
import moment from 'moment';

describe('Element', function () {
  describe('#get', function () {
    context('when the element is not expandable', function () {
      const element = new Element('name', 'test');

      it('returns undefined', function () {
        expect(element.get('name')).to.equal(undefined);
      });
    });

    context('when the element exists for the key', function () {
      const element = new Element('key', { name: 'test' });

      it('returns the element', function () {
        expect(element.get('name').currentValue).to.equal('test');
      });
    });

    context('when the element is deleted', function () {
      const element = new Element('key', {});
      const child = element.insertEnd('name', 'test');

      before(function () {
        child.remove();
      });

      it('returns undefined', function () {
        expect(element.get('test')).to.equal(undefined);
      });
    });

    context('when the element field is changed', function () {
      const element = new Element('key', { name: 'test' });
      const child = element.elements.at(0);

      before(function () {
        child.rename('testing');
      });

      it('returns undefined for the original key', function () {
        expect(element.get('name')).to.equal(undefined);
      });

      it('returns the element for the new key', function () {
        expect(element.get('testing')).to.equal(child);
      });
    });

    context('when the element does not exist for the key', function () {
      const element = new Element('key', { name: 'test' });

      it('returns undefined', function () {
        expect(element.get('test')).to.equal(undefined);
      });
    });
  });

  describe('#at', function () {
    context('when the element is not expandable', function () {
      const element = new Element('name', 'test');

      it('returns undefined', function () {
        expect(element.at(0)).to.equal(undefined);
      });
    });

    context('when the element exists for the index', function () {
      const element = new Element('key', ['item0', 'item1']);

      it('returns the element', function () {
        expect(element.at(0).currentValue).to.equal('item0');
        expect(element.at(1).currentValue).to.equal('item1');
      });
    });

    context('when a non-added element has been removed', function () {
      const element = new Element('key', ['item0', 'item1']);

      before(function () {
        element.at(0).remove();
      });

      it('returns the original elements', function () {
        expect(element.at(0).currentValue).to.equal('item0');
        expect(element.at(0).currentKey).to.equal(0);
        expect(element.at(0).isRemoved()).to.equal(true);
        expect(element.at(1).currentValue).to.equal('item1');
        /* Since element removed was not added, keys not modified */
        expect(element.at(1).currentKey).to.equal(1);
      });
    });

    context('when an added element has been removed', function () {
      const element = new Element('key', []);
      const child = element.insertEnd('', 'test');

      before(function () {
        child.remove();
      });

      it('returns undefined', function () {
        expect(element.at(0)).to.equal(undefined);
      });
    });

    context('when added elements are removed from the middle', function () {
      const element = new Element('key', []);
      const child1 = element.insertEnd('', 'test1');
      element.insertEnd('', 'test2');
      const child2 = element.insertEnd('', 'test3');
      element.insertEnd('', 'test4');
      const child3 = element.insertEnd('', 'test5');

      before(function () {
        expect(element.generateObject()).to.deep.equal([
          'test1',
          'test2',
          'test3',
          'test4',
          'test5',
        ]);
        child1.remove();
        child2.remove();
        child3.remove();
      });

      it('returns the correct elements', function () {
        expect(element.at(0).currentValue).to.equal('test2');
        expect(element.at(0).currentKey).to.equal(0);
        expect(element.at(1).currentValue).to.equal('test4');
        expect(element.at(1).currentKey).to.equal(1);
        expect(element.at(2)).to.equal(undefined);
      });
    });

    context('when the element value is changed', function () {
      const element = new Element('key', ['test']);
      const child = element.elements.at(0);

      before(function () {
        child.edit('test2');
      });

      it('returns the new element for the index', function () {
        expect(element.at(0)).to.equal(child);
        expect(element.at(0).currentValue).to.equal('test2');
      });
    });

    context('when the element does not exist for the key', function () {
      const element = new Element('key', ['item0', 'item1']);

      it('returns undefined', function () {
        expect(element.get(2)).to.equal(undefined);
      });
    });
  });

  describe('#cancel', function () {
    context('when the element is invalid', function () {
      const doc = new Document({});
      const element = new Element('string', 'testing', false, doc);
      before(function () {
        element.setInvalid('testing', 'Date', 'invalid');
        element.cancel();
      });

      it('reverts the current value back to the original', function () {
        expect(element.currentValue).to.equal('testing');
      });

      it('reverts the current type back to the original', function () {
        expect(element.currentType).to.equal('String');
      });
    });
  });

  describe('#generateObject', function () {
    const doc = new Document({});

    context('when the element has child elements', function () {
      context('when the type is array', function () {
        const element = new Element('test', [1, 2], false, doc);

        it('returns the array', function () {
          expect(element.generateObject()).to.deep.equal([1, 2]);
        });
      });

      context('when the type is object', function () {
        const element = new Element('test', { test: 'value' }, false, doc);

        it('returns the array', function () {
          expect(element.generateObject()).to.deep.equal({ test: 'value' });
        });
      });
    });

    context('when the element has no child elements', function () {
      context('when the current value is 0', function () {
        const element = new Element('test', 0, false, doc);

        it('returns 0', function () {
          expect(element.generateObject()).to.equal(0);
        });
      });

      context('when the current value is 1', function () {
        const element = new Element('test', 1, false, doc);

        it('returns 1', function () {
          expect(element.generateObject()).to.equal(1);
        });
      });

      context('when the current value is ""', function () {
        const element = new Element('test', '', false, doc);

        it('returns ""', function () {
          expect(element.generateObject()).to.equal('');
        });
      });

      context('when the current value is null', function () {
        const element = new Element('test', null, false, doc);

        it('returns null', function () {
          expect(element.generateObject()).to.equal(null);
        });
      });

      context('when the current value is undefined', function () {
        const element = new Element('test', undefined, false, doc);

        it('returns undefined', function () {
          expect(element.generateObject()).to.equal(undefined);
        });
      });

      context('when the current value is false', function () {
        const element = new Element('test', false, false, doc);

        it('returns false', function () {
          expect(element.generateObject()).to.equal(false);
        });
      });

      context('when the current value is truthy', function () {
        const element = new Element('test', 'test', false, doc);

        it('returns the value', function () {
          expect(element.generateObject()).to.equal('test');
        });
      });
    });
  });

  describe('#generateOriginalObject', function () {
    const doc = new Document({});

    context('when the element has child elements', function () {
      context('when the type is array', function () {
        const element = new Element('test', [1, 2], false, doc);

        it('returns the array', function () {
          expect(element.generateOriginalObject()).to.deep.equal([1, 2]);
        });
      });

      context('when the type is object', function () {
        const element = new Element('test', { test: 'value' }, false, doc);

        it('returns the array', function () {
          expect(element.generateOriginalObject()).to.deep.equal({
            test: 'value',
          });
        });
      });
    });

    context('when the element has no child elements', function () {
      context('when the current value is 0', function () {
        const element = new Element('test', 0, false, doc);

        it('returns 0', function () {
          expect(element.generateOriginalObject()).to.equal(0);
        });
      });

      context('when the current value is 1', function () {
        const element = new Element('test', 1, false, doc);

        it('returns 1', function () {
          expect(element.generateOriginalObject()).to.equal(1);
        });
      });

      context('when the value is ""', function () {
        const element = new Element('test', '', false, doc);

        it('returns ""', function () {
          expect(element.generateOriginalObject()).to.equal('');
        });
      });

      context('when the value is null', function () {
        const element = new Element('test', null, false, doc);

        it('returns null', function () {
          expect(element.generateOriginalObject()).to.equal(null);
        });
      });

      context('when the value is undefined', function () {
        const element = new Element('test', undefined, false, doc);

        it('returns undefined', function () {
          expect(element.generateOriginalObject()).to.equal(undefined);
        });
      });

      context('when the value is false', function () {
        const element = new Element('test', false, false, doc);

        it('returns false', function () {
          expect(element.generateOriginalObject()).to.equal(false);
        });
      });

      context('when the value is a string', function () {
        const element = new Element('test', 'test', false, doc);

        it('returns the value', function () {
          expect(element.generateOriginalObject()).to.equal('test');
        });
      });

      context('when the current value is truthy', function () {
        const element = new Element('test', false, false, doc);
        element.edit(true);

        it('returns the original value', function () {
          expect(element.generateOriginalObject()).to.equal(false);
        });
      });
    });
  });

  describe('#insertEnd', function () {
    context('when the new embedded element is a document', function () {
      const doc = new Document({});
      const element = new Element(
        'email',
        { work: 'work@example.com' },
        false,
        doc
      );

      before(function () {
        element.insertEnd('home', 'home@example.com');
      });

      it('adds the new embedded element', function () {
        expect(element.elements.at(1).key).to.equal('home');
        expect(element.elements.at(1).value).to.equal('home@example.com');
      });

      it('flags the new element as added', function () {
        expect(element.elements.at(1).isAdded()).to.equal(true);
      });
    });
    context(
      'when the embedded element is an array of embedded documents',
      function () {
        const doc = new Document({});
        const element = new Element('emails', [], false, doc);

        before(function () {
          element.insertEnd('', '').edit({ home: 'home@example.com' });
        });

        it('adds the new embedded element', function () {
          expect(element.elements.at(0).elements.at(0).key).to.equal('home');
          expect(element.elements.at(0).elements.at(0).value).to.equal(
            'home@example.com'
          );
        });

        it('flags the new elements as added', function () {
          expect(element.elements.at(0).isAdded()).to.equal(true);
          expect(element.elements.at(0).elements.at(0).isAdded()).to.equal(
            true
          );
        });

        it('does not flag the new elements as edited', function () {
          expect(element.elements.at(0).isEdited()).to.equal(false);
          expect(element.elements.at(0).elements.at(0).isEdited()).to.equal(
            false
          );
        });

        it('does not flag the new elements as renamed', function () {
          expect(element.elements.at(0).isRenamed()).to.equal(false);
          expect(element.elements.at(0).elements.at(0).isRenamed()).to.equal(
            false
          );
        });
      }
    );
    /* More testing embedded arrays is in 'modifying arrays' */
  });

  describe('#insertAfter', function () {
    context('when the new embedded element is a document', function () {
      const doc = new Document({});
      const element = new Element(
        'email',
        { key0: 'item0', key2: 'item2' },
        false,
        doc
      );

      before(function () {
        element.insertAfter(element.at(0), 'key1', 'item1');
      });

      it('adds the new embedded element', function () {
        expect(element.elements.at(1).key).to.equal('key1');
        expect(element.elements.at(1).value).to.equal('item1');
      });

      it('flags the new element as added', function () {
        expect(element.elements.at(1).isAdded()).to.equal(true);
      });
    });
    /* Testing embedded arrays is in 'modifying arrays' */
  });

  describe('#isDuplicateKey', function () {
    const doc = new Document({});
    doc.insertEnd('first', 'test');
    const last = doc.insertEnd('last', 'test');

    context('when the key is a duplicate', function () {
      it('returns true', function () {
        expect(last.isDuplicateKey('first')).to.equal(true);
      });
    });

    context('when the key is not a duplicate', function () {
      it('returns false', function () {
        expect(last.isDuplicateKey('test')).to.equal(false);
      });
    });

    context('when the key is the same as the element key', function () {
      it('returns false', function () {
        expect(last.isDuplicateKey('last')).to.equal(false);
      });
    });
  });

  describe('#isLast', function () {
    const doc = new Document({});
    const first = doc.insertEnd('first', 'test');
    const last = doc.insertEnd('last', 'test');

    context('when the element is the last element', function () {
      it('returns true', function () {
        expect(last.isLast()).to.equal(true);
      });
    });

    context('when the element is not the last element', function () {
      it('returns false', function () {
        expect(first.isLast()).to.equal(false);
      });
    });
  });

  describe('#next', function () {
    context('when the element is the last element in the parent', function () {
      context('when the value is changed to {', function () {
        const doc = new Document({});
        doc.insertEnd('first', 'test');
        const last = doc.insertEnd('last', 'test');

        before(function () {
          last.edit('{');
          last.next();
        });

        it('changes the element to an object', function () {
          expect(last.elements.at(0).currentKey).to.equal('');
          expect(last.elements.at(0).currentValue).to.equal('');
        });
      });

      context('when the value is changed to [', function () {
        const doc = new Document({});
        doc.insertEnd('first', 'test');
        const last = doc.insertEnd('last', 'test');

        before(function () {
          last.edit('[');
          last.next();
        });

        it('changes the element to an empty array', function () {
          expect(last.elements.at(0).currentKey).to.equal(0);
          expect(last.elements.at(0).currentValue).to.equal('');
        });
      });

      context(
        'when the value is changed to [ and additional elements are added',
        function () {
          const doc = new Document({});
          doc.insertEnd('first', 'test');
          const last = doc.insertEnd('last', 'test');
          let newLast = null;

          before(function () {
            last.edit('[');
            last.next();
            newLast = last.elements.at(0);
            newLast.edit('testing');
            newLast.next();
          });

          it('adds the additional elements to the array', function () {
            expect(last.elements.at(1).currentKey).to.equal(1);
            expect(last.elements.at(1).currentValue).to.equal('');
          });
        }
      );

      context('when the value is different', function () {
        const doc = new Document({});
        doc.insertEnd('first', 'test');
        const last = doc.insertEnd('last', 'test');

        before(function () {
          last.edit('test');
          last.next();
        });

        it('adds another element to the parent', function () {
          expect(doc.elements.at(2).currentKey).to.equal('');
          expect(doc.elements.at(2).currentValue).to.equal('');
        });
      });
    });

    context(
      'when the element is not the last element is in the parent',
      function () {
        context(
          'when the next element in the parent is not added',
          function () {
            const doc = new Document({
              first: 'test-first',
              second: 'test-second',
            });
            const element = doc.elements.at(0);

            before(function () {
              element.next();
            });

            it('inserts a new empty element', function () {
              expect(doc.elements.at(1).currentKey).to.equal('');
              expect(doc.elements.at(1).currentValue).to.equal('');
            });
          }
        );

        context('when the current element is added', function () {
          context('when the current element is empty', function () {
            const doc = new Document({ first: 'test-first' });

            before(function () {
              const element = doc.insertEnd('', '');
              element.next();
            });

            it('removes the empty element', function () {
              expect(doc.elements.size).to.equal(2);
            });
          });
        });

        context('when the next element in the parent is added', function () {
          context('when the next element is empty', function () {
            const doc = new Document({ first: 'test-first' });
            const element = doc.elements.at(0);

            before(function () {
              doc.insertEnd('', '');
              element.next();
            });

            it('ignores the empty element', function () {
              expect(doc.elements.size).to.equal(2);
            });
          });

          context('when the next element is not empty', function () {
            const doc = new Document({ first: 'test-first' });
            const element = doc.elements.at(0);

            before(function () {
              doc.insertEnd('test', '');
              element.next();
            });

            it('inserts a new empty element', function () {
              expect(doc.elements.size).to.equal(3);
            });
          });
        });
      }
    );
  });

  describe('#isEditable', function () {
    context(
      'when the key is _id and the value is a nested object',
      function () {
        const subelement2 = new Element('subsubkey', 'test value');
        const subelement = new Element('subkey', subelement2);
        const element = new Element('_id', subelement);
        subelement.parent = element;
        subelement2.parent = subelement;
        context('#isValueEditable', function () {
          it('top level element returns false', function () {
            expect(element.isValueEditable()).to.equal(false);
          });
          it('sub element returns false', function () {
            expect((element.value as any).isValueEditable()).to.equal(false);
          });
          it('sub sub element returns false', function () {
            expect((element.value as any).value.isValueEditable()).to.equal(
              false
            );
          });
        });
        context('#isKeyEditable', function () {
          it('top level element returns false', function () {
            expect(element.isKeyEditable()).to.equal(false);
            expect(element.isParentEditable()).to.equal(true);
          });
          it('sub element returns false', function () {
            expect((element.value as any).isKeyEditable()).to.equal(false);
            expect((element.value as any).isParentEditable()).to.equal(false);
          });
          it('sub sub element returns false', function () {
            expect((element.value as any).value.isKeyEditable()).to.equal(
              false
            );
            expect((element.value as any).value.isParentEditable()).to.equal(
              false
            );
          });
        });
      }
    );
  });

  describe('#isValueEditable', function () {
    context('when the key is _id', function () {
      context('when the element is not added', function () {
        const element = new Element('_id', 'test', false);

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the element is added', function () {
        const element = new Element('_id', 'test', true);

        it('returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
      });
    });

    context('when the key is not _id', function () {
      context('when the type is ObjectId', function () {
        const element = new Element('name', new ObjectId(), false);

        it('returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
      });

      context('when the type is binary', function () {
        const element = new Element('name', new Binary('test'), false);

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is code', function () {
        const element = new Element('name', new Code('test'), false);

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is min key', function () {
        const element = new Element('name', new MinKey(), false);

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is max key', function () {
        const element = new Element('name', new MaxKey(), false);

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is a timestamp', function () {
        const element = new Element('name', new Timestamp(0, 0), false);

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is editable', function () {
        const element = new Element('name', 'test', false);

        it('returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
      });
    });
  });

  describe('#isValueDecrypted', function () {
    it('returns false when the element was not decrypted and is not nested', function () {
      const doc = new Document({ a: 1 });
      expect(doc.get('a').isValueDecrypted()).to.equal(false);
    });

    it('returns false when the element was not decrypted and is nested', function () {
      const doc = new Document({ a: { b: 1 } });
      expect(doc.get('a').get('b').isValueDecrypted()).to.equal(false);
    });

    it('returns true when the element was decrypted and is not nested', function () {
      const doc = new Document({
        a: { b: 1 },
        [Symbol.for('@@mdb.decryptedKeys')]: ['a'],
      });
      expect(doc.get('a').isValueDecrypted()).to.equal(true);
      expect(doc.get('a').get('b').isValueDecrypted()).to.equal(false);
    });

    it('returns true when the element was decrypted and is nested', function () {
      const doc = new Document({
        a: {
          b: 1,
          c: 2,
          d: Object.assign([3, 4], {
            [Symbol.for('@@mdb.decryptedKeys')]: ['0'],
          }),
          [Symbol.for('@@mdb.decryptedKeys')]: ['b'],
        },
      });
      expect(doc.get('a').isValueDecrypted()).to.equal(false);
      expect(doc.get('a').get('b').isValueDecrypted()).to.equal(true);
      expect(doc.get('a').get('c').isValueDecrypted()).to.equal(false);
      expect(doc.get('a').get('d').isValueDecrypted()).to.equal(false);
      expect(doc.get('a').get('d').at(0).isValueDecrypted()).to.equal(true);
      expect(doc.get('a').get('d').at(1).isValueDecrypted()).to.equal(false);
    });
  });

  describe('#containsDecryptedChildren', function () {
    it('returns false when the element was not decrypted and is not nested', function () {
      const doc = new Document({ a: 1 });
      expect(doc.get('a').containsDecryptedChildren()).to.equal(false);
    });

    it('returns false when the element was not decrypted and is nested', function () {
      const doc = new Document({ a: { b: 1 } });
      expect(doc.get('a').get('b').containsDecryptedChildren()).to.equal(false);
    });

    it('returns true when the element was decrypted and is not nested', function () {
      const doc = new Document({
        a: { b: 1 },
        [Symbol.for('@@mdb.decryptedKeys')]: ['a'],
      });
      expect(doc.get('a').containsDecryptedChildren()).to.equal(true);
      expect(doc.get('a').get('b').containsDecryptedChildren()).to.equal(false);
    });

    it('returns true when the element was decrypted and is nested', function () {
      const doc = new Document({
        a: {
          b: 1,
          c: 2,
          d: Object.assign([3, 4], {
            [Symbol.for('@@mdb.decryptedKeys')]: ['0'],
          }),
          [Symbol.for('@@mdb.decryptedKeys')]: ['b'],
        },
      });
      // Note: This is the only case in which .containsDecryptedChildren()
      // and .isValueDecrypted() differ.
      expect(doc.get('a').containsDecryptedChildren()).to.equal(true);
      expect(doc.get('a').get('b').containsDecryptedChildren()).to.equal(true);
      expect(doc.get('a').get('c').containsDecryptedChildren()).to.equal(false);
      expect(doc.get('a').get('d').containsDecryptedChildren()).to.equal(true);
      expect(doc.get('a').get('d').at(0).containsDecryptedChildren()).to.equal(
        true
      );
      expect(doc.get('a').get('d').at(1).containsDecryptedChildren()).to.equal(
        false
      );
    });

    context('#isKeyEditable', function () {
      it('is affected by #containsDecryptedChildren', function () {
        const doc = new Document({
          a: {
            b: 1,
            c: 2,
            [Symbol.for('@@mdb.decryptedKeys')]: ['b'],
          },
        });
        expect(doc.get('a').isKeyEditable()).to.equal(false);
        expect(doc.get('a').get('b').isKeyEditable()).to.equal(false);
        expect(doc.get('a').get('c').isKeyEditable()).to.equal(true);
      });
    });
  });

  describe('#isModified', function () {
    context('when the element has no children', function () {
      context('when the element is not modified', function () {
        const element = new Element('name', 'Aphex Twin', false);

        it('returns false', function () {
          expect(element.isModified()).to.equal(false);
        });
      });

      context('when the element is added', function () {
        const element = new Element('name', 'Aphex Twin', true);

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is edited', function () {
        const element = new Element('name', 'Aphex Twin', false);

        before(function () {
          element.edit('APX');
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is removed', function () {
        const element = new Element('name', 'Aphex Twin', false);

        before(function () {
          element.remove();
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is reverted', function () {
        const element = new Element('name', 'Aphex Twin', false);

        before(function () {
          element.edit('APX');
          element.revert();
        });

        it('returns false', function () {
          expect(element.isModified()).to.equal(false);
        });
      });
    });

    context('when the element has children', function () {
      context('when a child element is added', function () {
        const element = new Element('names', [], false);

        before(function () {
          element.insertEnd('', 'testing');
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when a child element is edited', function () {
        const element = new Element('names', ['testing'], false);

        before(function () {
          element.elements.at(0).edit('test');
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when a child element is removed', function () {
        const element = new Element('names', ['testing'], false);

        before(function () {
          element.elements.at(0).remove();
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });
    });
  });

  describe('#isRenamed', function () {
    context('when the element has no children', function () {
      context('when the element is not modified', function () {
        const element = new Element('name', 'Pineapple', false);

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is added', function () {
        const element = new Element('name', 'Pineapple', true);

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is edited', function () {
        const element = new Element('name', 'Pineapple', false);

        before(function () {
          element.edit('not pineapple');
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is removed', function () {
        const element = new Element('name', 'Pineapple', false);

        before(function () {
          element.remove();
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is renamed', function () {
        const element = new Element('name', 'Pineapple', false);

        before(function () {
          element.edit('not pineapple');
        });

        it('returns true', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is reverted', function () {
        const element = new Element('name', 'Pineapple', false);

        before(function () {
          element.rename('Not pineapple');
          element.revert();
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });
    });

    context('when the element has children', function () {
      context('when a child element is edited', function () {
        const element = new Element('names', ['testing'], false);

        before(function () {
          element.elements.at(0).edit('test');
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when a child element is renamed', function () {
        const element = new Element('names', ['testing'], false);

        before(function () {
          element.elements.at(0).remove();
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is renamed', function () {
        const element = new Element('names', ['testing'], false);

        before(function () {
          element.rename('test');
        });

        it('returns true', function () {
          expect(element.isRenamed()).to.equal(true);
        });
      });
    });
  });

  describe('#new', function () {
    context('when the element is primitive', function () {
      const element = new Element('name', 'Aphex Twin', false);

      it('sets the key', function () {
        expect(element.key).to.equal('name');
      });

      it('sets the current key', function () {
        expect(element.currentKey).to.equal('name');
      });

      it('sets the value', function () {
        expect(element.value).to.equal('Aphex Twin');
      });

      it('sets the current value', function () {
        expect(element.currentValue).to.equal('Aphex Twin');
      });

      it('sets the element type', function () {
        expect(element.type).to.equal('String');
      });

      it('sets the element current type', function () {
        expect(element.currentType).to.equal('String');
      });

      it('creates a uuid', function () {
        expect(element.uuid).to.not.equal(null);
      });
    });

    context('when the element is an array', function () {
      const element = new Element('albums', ['Windowlicker'], false);

      it('sets the key', function () {
        expect(element.key).to.equal('albums');
      });

      it('sets the current key', function () {
        expect(element.currentKey).to.equal('albums');
      });

      it('sets the elements', function () {
        expect(element.elements.size).to.equal(1);
      });

      it('sets the element type', function () {
        expect(element.type).to.equal('Array');
      });

      it('sets the element current type', function () {
        expect(element.currentType).to.equal('Array');
      });
    });

    context('when the element is an embedded document', function () {
      const element = new Element('email', { work: 'test@example.com' }, false);

      it('sets the key', function () {
        expect(element.key).to.equal('email');
      });

      it('sets the current key', function () {
        expect(element.currentKey).to.equal('email');
      });

      it('sets the elements', function () {
        expect(element.elements.size).to.equal(1);
      });

      it('sets the element type', function () {
        expect(element.type).to.equal('Object');
      });

      it('sets the element current type', function () {
        expect(element.currentType).to.equal('Object');
      });
    });
  });

  describe('#setInvalid', function () {
    const element = new Element('val', 1, false);

    before(function () {
      element.setInvalid('testing', 'Date', 'invalid');
    });

    it('sets the current value', function () {
      expect(element.currentValue).to.equal('testing');
    });

    it('sets the current type', function () {
      expect(element.currentType).to.equal('Date');
    });

    it('sets the current type to invalid', function () {
      expect(element.isCurrentTypeValid()).to.equal(false);
    });

    it('sets the invalid type message', function () {
      expect(element.invalidTypeMessage).to.equal('invalid');
    });

    context('when subsequently settting to valid', function () {
      before(function () {
        element.setValid();
      });

      it('sets the type as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });

      it('removes the invalid message', function () {
        expect(element.invalidTypeMessage).to.equal(undefined);
      });
    });
  });

  describe('#edit', function () {
    context('when the value is a date', function () {
      const date = new Date('2014-12-01 12:00:00.000');
      const element = new Element('val', date, false);

      context('when editing to the same value', function () {
        before(function () {
          element.currentValue = moment(date).format(DATE_FORMAT);
          element.setValid();
        });

        it('does not flag the element as edited', function () {
          expect(element.isEdited()).to.equal(false);
        });
      });

      context('when editing to an invalid date', function () {
        before(function () {
          element.currentValue = 'i am not a date';
        });

        it('flags the element as edited', function () {
          expect(element.isEdited()).to.equal(true);
        });
      });
    });

    context('when the value is an object id', function () {
      const oid = new ObjectId();
      const element = new Element('val', oid, false);

      context('when editing to the same value', function () {
        before(function () {
          element.currentValue = oid.toHexString();
          element.setValid();
        });

        it('does not flag the element as edited', function () {
          expect(element.isEdited()).to.equal(false);
        });
      });

      context('when editing to an invalid object id', function () {
        before(function () {
          element.currentValue = 'not a hex string';
        });

        it('flags the element as edited', function () {
          expect(element.isEdited()).to.equal(true);
        });
      });
    });

    context('when the value is an int32', function () {
      const element = new Element('val', new Int32(10), false);

      context('when editing to the same value', function () {
        before(function () {
          element.edit(new Int32(10));
        });

        it('does not flag the element as edited', function () {
          expect(element.isEdited()).to.equal(false);
        });
      });
    });

    context('when the value is a double', function () {
      const element = new Element('val', new Double(10.0), false);

      context('when editing to the same value', function () {
        before(function () {
          element.edit(new Double(10.0));
        });

        it('does not flag the element as edited', function () {
          expect(element.isEdited()).to.equal(false);
        });
      });
    });

    context('when the value is a long', function () {
      const element = new Element('val', Long.fromNumber(10), false);

      context('when editing to the same value', function () {
        before(function () {
          element.edit(Long.fromNumber(10.0));
        });

        it('does not flag the element as edited', function () {
          expect(element.isEdited()).to.equal(false);
        });
      });
    });

    context('when the value is a decimal 128', function () {
      const element = new Element('val', new Decimal128('10.0'), false);

      context('when editing to the same value', function () {
        before(function () {
          element.edit(new Decimal128('10.0'));
        });

        it('does not flag the element as edited', function () {
          expect(element.isEdited()).to.equal(false);
        });
      });
    });

    context('when the element is a document', function () {
      const element = new Element('val', { test: 'value' }, false);

      context('when the element is changed to a non-expandable', function () {
        before(function () {
          element.edit('testing');
        });

        it('changes the current value', function () {
          expect(element.currentValue).to.equal('testing');
        });

        it('changes the current type', function () {
          expect(element.currentType).to.equal('String');
        });

        it('removes the elements', function () {
          expect(element.elements).to.equal(undefined);
        });

        it('sets the element as edited', function () {
          expect(element.isEdited()).to.equal(true);
        });

        it('generateOriginalObject returns the original value', function () {
          expect(element.generateOriginalObject()).to.deep.equal({
            test: 'value',
          });
        });

        context('when the element is subsequently reverted', function () {
          before(function () {
            element.revert();
          });

          it('returns the elements from the original value', function () {
            expect(element.elements.at(0).currentKey).to.equal('test');
            expect(element.elements.at(0).currentValue).to.equal('value');
          });

          it('returns the original value from generateObject', function () {
            expect(element.generateObject()).to.deep.equal({ test: 'value' });
          });

          it('returns the original value from generateOriginalObject', function () {
            expect(element.generateOriginalObject()).to.deep.equal({
              test: 'value',
            });
          });

          it('sets the current type', function () {
            expect(element.currentType).to.equal('Object');
          });

          it('sets edited to false', function () {
            expect(element.isEdited()).to.equal(false);
          });
        });
      });
    });

    context('when the element is not a document', function () {
      context('when the value is changed', function () {
        context('when the value is changed to another primitive', function () {
          const element = new Element('name', 'Aphex Twin', false);

          before(function () {
            element.edit('APX');
          });

          it('updates the current value', function () {
            expect(element.currentValue).to.equal('APX');
          });

          it('does not modify the original', function () {
            expect(element.value).to.equal('Aphex Twin');
          });

          it('flags the element as edited', function () {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function () {
            expect(element.currentType).to.equal('String');
          });
        });

        context('when the value is changed to an int32', function () {
          const element = new Element('name', 'Aphex Twin', false);

          before(function () {
            element.edit(new Int32(42));
          });

          it('updates the current value', function () {
            expect(element.currentValue).to.deep.equal(new Int32(42));
          });

          it('does not modify the original', function () {
            expect(element.value).to.equal('Aphex Twin');
          });

          it('flags the element as edited', function () {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function () {
            expect(element.currentType).to.equal('Int32');
          });
        });

        context('when the value is changed to an int64', function () {
          const element = new Element('name', 'Aphex Twin', false);

          before(function () {
            element.edit(new Long(4200000000000));
          });

          it('updates the current value', function () {
            expect(element.currentValue).to.deep.equal(new Long(4200000000000));
          });

          it('does not modify the original', function () {
            expect(element.value).to.equal('Aphex Twin');
          });

          it('flags the element as edited', function () {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function () {
            expect(element.currentType).to.equal('Int64');
          });
        });

        context('when the value is changed to an double', function () {
          const element = new Element('name', 'Aphex Twin', false);

          before(function () {
            element.edit(new Double(42.23));
          });

          it('updates the current value', function () {
            expect(element.currentValue).to.deep.equal(new Double(42.23));
          });

          it('does not modify the original', function () {
            expect(element.value).to.equal('Aphex Twin');
          });

          it('flags the element as edited', function () {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function () {
            expect(element.currentType).to.equal('Double');
          });
        });

        context(
          'when the value is changed to an empty embedded document',
          function () {
            const element = new Element('email', 'test@example.com', false);

            before(function () {
              element.edit({});
            });

            it('changes the document to an embedded document', function () {
              expect(element.elements.size).to.equal(0);
            });

            it('removes the current value', function () {
              expect(element.currentValue).to.equal(null);
            });

            it('keeps the original value as the primitive', function () {
              expect(element.value).to.equal('test@example.com');
            });

            it('flags the element as edited', function () {
              expect(element.isEdited()).to.equal(true);
            });

            it('sets the element current type', function () {
              expect(element.currentType).to.equal('Object');
            });
          }
        );

        context(
          'when the value is changed to an embedded document',
          function () {
            const element = new Element('email', 'test@example.com', false);

            before(function () {
              element.edit({ home: 'home@example.com' });
            });

            it('changes the document to an embedded document', function () {
              expect(element.elements.size).to.equal(1);
              expect(element.elements.at(0).key).to.equal('home');
              expect(element.elements.at(0).value).to.equal('home@example.com');
            });

            it('removes the current value', function () {
              expect(element.currentValue).to.equal(null);
            });

            it('keeps the original value as the primitive', function () {
              expect(element.value).to.equal('test@example.com');
            });

            it('flags the element as edited', function () {
              expect(element.isEdited()).to.equal(true);
            });

            it('sets the element current type', function () {
              expect(element.currentType).to.equal('Object');
            });
          }
        );

        context('when the value is changed to an empty array', function () {
          const element = new Element('email', 'test@example.com', false);

          before(function () {
            element.edit([]);
          });

          it('changes the document to an embedded document', function () {
            expect(element.elements.size).to.equal(0);
          });

          it('removes the current value', function () {
            expect(element.currentValue).to.equal(null);
          });

          it('keeps the original value as the primitive', function () {
            expect(element.value).to.equal('test@example.com');
          });

          it('flags the element as edited', function () {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function () {
            expect(element.currentType).to.equal('Array');
          });
        });

        context('when the value is changed to an array', function () {
          const element = new Element('email', 'test@example.com', false);

          before(function () {
            element.edit(['home@example.com']);
          });

          it('changes the document to an embedded document', function () {
            expect(element.elements.size).to.equal(1);
            expect(element.elements.at(0).key).to.equal(0);
            expect(element.elements.at(0).value).to.equal('home@example.com');
          });

          it('removes the current value', function () {
            expect(element.currentValue).to.equal(null);
          });

          it('keeps the original value as the primitive', function () {
            expect(element.value).to.equal('test@example.com');
          });

          it('flags the element as edited', function () {
            expect(element.isEdited()).to.equal(true);
          });

          it('sets the element current type', function () {
            expect(element.currentType).to.equal('Array');
          });
        });
      });

      context('when the value is changed (2)', function () {
        const element = new Element('name', 'Aphex Twin', false);

        before(function () {
          element.edit('APX');
        });

        it('updates the current value', function () {
          expect(element.currentValue).to.equal('APX');
        });

        it('does not modify the original', function () {
          expect(element.value).to.equal('Aphex Twin');
        });

        it('flags the element as edited', function () {
          expect(element.isEdited()).to.equal(true);
        });
      });
    });
  });

  describe('#rename', function () {
    const element = new Element('name', 'Aphex Twin', false);

    before(function () {
      element.rename('alias');
    });

    it('updates the current key', function () {
      expect(element.currentKey).to.equal('alias');
    });

    it('does not modify the original', function () {
      expect(element.key).to.equal('name');
    });

    it('flags the element as edited', function () {
      expect(element.isEdited()).to.equal(true);
    });

    it('flags the element as renamed', function () {
      expect(element.isRenamed()).to.equal(true);
    });
  });

  describe('#remove', function () {
    context('when the element has not been edited', function () {
      const element = new Element('name', 'Aphex Twin', false);

      before(function () {
        element.remove();
      });

      it('flags the element as removed', function () {
        expect(element.isRemoved()).to.equal(true);
      });
    });

    context('when the element has been edited', function () {
      const element = new Element('name', 'Aphex Twin', false);

      before(function () {
        element.edit('name');
        element.remove();
      });

      it('flags the element as removed', function () {
        expect(element.isRemoved()).to.equal(true);
      });

      it('resets the edits to the original', function () {
        expect(element.isEdited()).to.equal(false);
      });

      it('is not flagged as renamed', function () {
        expect(element.isRenamed()).to.equal(false);
      });
    });

    context('when the element has been added to a parent', function () {
      const doc = new Document({});
      const element = doc.insertEnd('name', 'test');

      before(function () {
        element.remove();
      });

      it('removes the element from the parent', function () {
        expect(doc.elements.size).to.equal(0);
      });
    });
  });

  describe('#revert', function () {
    context('when the element is edited', function () {
      const element = new Element('name', 'Aphex Twin', false);

      before(function () {
        element.edit('alias');
        element.revert();
      });

      it('sets the keys back to the original', function () {
        expect(element.key).to.equal('name');
        expect(element.currentKey).to.equal('name');
      });

      it('sets the values back to the original', function () {
        expect(element.value).to.equal('Aphex Twin');
        expect(element.currentValue).to.equal('Aphex Twin');
      });

      it('resets the flags', function () {
        expect(element.isEdited()).to.equal(false);
        expect(element.isRenamed()).to.equal(false);
      });
    });

    context('when the element is removed', function () {
      const element = new Element('name', 'Aphex Twin', false);

      before(function () {
        element.remove();
        element.revert();
      });

      it('sets the keys back to the original', function () {
        expect(element.key).to.equal('name');
        expect(element.currentKey).to.equal('name');
      });

      it('sets the values back to the original', function () {
        expect(element.value).to.equal('Aphex Twin');
        expect(element.currentValue).to.equal('Aphex Twin');
      });

      it('resets the flags', function () {
        expect(element.isRemoved()).to.equal(false);
        expect(element.isRenamed()).to.equal(false);
      });
    });

    context('when elements have been added', function () {
      const element = new Element('email', { work: 'work@example.com' }, false);

      before(function () {
        element.insertEnd('home', 'home@example.com');
        element.revert();
      });

      it('sets the keys back to the original', function () {
        expect(element.key).to.equal('email');
        expect(element.currentKey).to.equal('email');
      });

      it('sets the elements back to the original', function () {
        expect(element.elements.size).to.equal(1);
        expect(element.elements.at(0).key).to.equal('work');
      });
    });

    context('when the element itself has been added', function () {
      const doc = new Document({});
      const element = doc.insertEnd('name', 'Aphex Twin');

      before(function () {
        element.revert();
      });

      it('removes the element from the parent document', function () {
        expect(doc.elements.size).to.equal(0);
      });
    });

    context('when the element has been converted to an object', function () {
      context('when child elements have been added', function () {
        const element = new Element('email', 'test@example.com', false);

        before(function () {
          element.edit({});
          element.insertEnd('home', 'test@example.com');
          element.revert();
        });

        it('sets the keys back to the original', function () {
          expect(element.key).to.equal('email');
          expect(element.currentKey).to.equal('email');
        });

        it('sets the elements back to the original', function () {
          expect(element.elements).to.equal(null);
        });

        it('sets the type back to the original', function () {
          expect(element.type).to.equal('String');
          expect(element.currentType).to.equal('String');
        });

        it('sets the value back to the original', function () {
          expect(element.value).to.equal('test@example.com');
          expect(element.currentValue).to.equal('test@example.com');
        });
      });
    });

    context('when the element has been converted to an array', function () {
      context('when child elements have been added', function () {
        const element = new Element('email', 'test@example.com', false);

        before(function () {
          element.edit([]);
          element.insertEnd('', 'test@example.com');
          element.revert();
        });

        it('sets the keys back to the original', function () {
          expect(element.key).to.equal('email');
          expect(element.currentKey).to.equal('email');
        });

        it('sets the elements back to the original', function () {
          expect(element.elements).to.equal(null);
        });

        it('sets the type back to the original', function () {
          expect(element.type).to.equal('String');
          expect(element.currentType).to.equal('String');
        });

        it('sets the value back to the original', function () {
          expect(element.value).to.equal('test@example.com');
          expect(element.currentValue).to.equal('test@example.com');
        });
      });
    });
  });

  describe('modifying arrays', function () {
    describe('#insertEnd', function () {
      const doc = new Document({});
      const items = ['work@example.com'];
      const element = new Element('emails', items, false, doc);
      const finalArray = [
        'work@example.com',
        'home@example.com',
        'home@example.com2',
        'home@example.com3',
      ];
      before(function () {
        element.insertEnd('', finalArray[1]);
        element.insertEnd('ignore', finalArray[2]);
        element.insertEnd(3, finalArray[3]);
      });
      it('adds the new embedded elements', function () {
        for (let i = 0; i < finalArray.length; i++) {
          expect(element.elements.at(i).currentKey).to.equal(i);
          expect(element.elements.at(i).key).to.equal(i);
          expect(element.elements.at(i).value).to.equal(finalArray[i]);
        }
      });
      it('flags the right elements as added', function () {
        expect(element.elements.at(0).isAdded()).to.equal(false);
        expect(element.elements.at(1).isAdded()).to.equal(true);
        expect(element.elements.at(2).isAdded()).to.equal(true);
        expect(element.elements.at(3).isAdded()).to.equal(true);
      });
      it('flags the right elements as modified', function () {
        expect(element.elements.at(0).isModified()).to.equal(false);
        expect(element.elements.at(1).isModified()).to.equal(true);
        expect(element.elements.at(2).isModified()).to.equal(true);
        expect(element.elements.at(3).isModified()).to.equal(true);
      });
      it('flags the right elements as edited', function () {
        expect(element.elements.at(0).isEdited()).to.equal(false);
        expect(element.elements.at(1).isEdited()).to.equal(false);
        expect(element.elements.at(2).isEdited()).to.equal(false);
        expect(element.elements.at(3).isEdited()).to.equal(false);
      });
      it('maintains the original with generateOriginalObject', function () {
        expect(element.generateOriginalObject()).to.deep.equal(items);
      });
    });

    describe('#insertAfter', function () {
      context('inserting into the array', function () {
        const doc = new Document({});
        const element = new Element('emails', ['item0'], false, doc);
        before(function () {
          element.insertAfter(element.at(0), 'key3', 'item3');
          element.insertAfter(element.at(0), 'ignore', 'item1');
          element.insertAfter(element.at(1), '', 'item2');
        });
        it('adds the new embedded elements', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.elements.at(i).currentKey).to.equal(i);
            expect(element.elements.at(i).value).to.equal(`item${i}`);
          }
        });
        it('flags the new element as added', function () {
          expect(element.elements.at(1).isAdded()).to.equal(true);
          expect(element.elements.at(2).isAdded()).to.equal(true);
          expect(element.elements.at(3).isAdded()).to.equal(true);
        });
        it('flags the original element as not modified', function () {
          expect(element.elements.at(0).isModified()).to.equal(false);
        });
        it('flags the original element as not renamed', function () {
          expect(element.elements.at(0).isRenamed()).to.equal(false);
        });
      });
      context('inserting into the middle of the array', function () {
        const doc = new Document({});
        const element = new Element(
          'items',
          ['item0', 'item2', 'item3'],
          false,
          doc
        );

        before(function () {
          element.insertAfter(element.at(0), 'key3', 'item1');
        });
        it('inserts the element into the list with the correct key', function () {
          expect(element.at(0).nextElement.currentKey).to.equal(1);
          expect(element.at(0).nextElement.key).to.equal(1);
          expect(element.at(0).nextElement.value).to.equal('item1');
        });
        it('updates the currentKey of subsequent elements', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i).currentKey).to.equal(i);
            expect(element.at(i).value).to.equal(`item${i}`);
          }
        });
        it('correctly marks elements as modified', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i).isModified()).to.equal(i === 1);
          }
        });
      });
      context('inserting into the end of the array', function () {
        const doc = new Document({});
        const element = new Element(
          'emails',
          ['item0', 'item1', 'item2'],
          false,
          doc
        );
        before(function () {
          element.insertAfter(element.at(2), 'key3', 'item3');
        });
        it('inserts the element into the list with the correct key', function () {
          expect(element.at(2).nextElement.currentKey).to.equal(3);
          expect(element.at(2).nextElement.value).to.equal('item3');
        });
        it('updates the key and currentKey of subsequent elements', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i).currentKey).to.equal(i);
            expect(element.at(i).value).to.equal(`item${i}`);
          }
        });
        it('correctly marks elements as modified', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i).isModified()).to.equal(i === 3);
          }
        });
      });
    });

    describe('#insertPlaceholder', function () {
      context('into an empty array', function () {
        const doc = new Document({});
        const element = new Element('emails', [], false, doc);
        before(function () {
          element.insertPlaceholder();
        });
        it('array has one element', function () {
          expect(element.at(0).currentKey).to.equal(0);
          expect(element.at(0).value).to.equal('');
          expect(element.elements.size).to.equal(1);
        });
        it('element is modified', function () {
          expect(element.at(0).isModified()).to.equal(true);
        });
      });
      context('into a full array', function () {
        const doc = new Document({});
        const element = new Element(
          'emails',
          ['item0', 'item1', 'item2'],
          false,
          doc
        );
        before(function () {
          element.insertPlaceholder();
        });
        it('inserts the element into the end', function () {
          expect(element.at(3).currentKey).to.equal(3);
          expect(element.at(3).value).to.equal('');
        });
        it('keeps the other elements the same', function () {
          expect(element.elements.size).to.equal(4);
          for (let i = 0; i < 3; i++) {
            expect(element.at(i).currentKey).to.equal(i);
            expect(element.at(i).value).to.equal(`item${i}`);
          }
        });
        it('element is modified', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i).isModified()).to.equal(i === 3);
          }
        });
      });
      context('insert after placeholders', function () {
        context('insertAfter', function () {
          context('with only placeholders', function () {
            context('multiple', function () {
              const doc = new Document({});
              const element = new Element('emails', [], false, doc);
              before(function () {
                element.insertPlaceholder();
                element.insertPlaceholder();
                const e = element.insertPlaceholder();
                element.insertAfter(e, '', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0).currentKey).to.equal(0);
                expect(element.at(0).value).to.equal('');
                expect(element.at(1).currentKey).to.equal(1);
                expect(element.at(1).value).to.equal('');
                expect(element.at(2).currentKey).to.equal(2);
                expect(element.at(2).value).to.equal('');
                expect(element.at(3).currentKey).to.equal(3);
                expect(element.at(3).value).to.equal('value');
              });
            });
            context('one', function () {
              const doc = new Document({});
              const element = new Element('emails', [], false, doc);
              before(function () {
                const e = element.insertPlaceholder();
                element.insertAfter(e, '', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0).currentKey).to.equal(0);
                expect(element.at(0).value).to.equal('');
                expect(element.at(1).currentKey).to.equal(1);
                expect(element.at(1).value).to.equal('value');
              });
            });
          });
          context('with keys and placeholders', function () {
            const doc = new Document({});
            const element = new Element('emails', ['first val'], false, doc);
            before(function () {
              element.insertPlaceholder();
              const e = element.insertPlaceholder();
              element.insertAfter(e, '', 'value');
            });
            it('inserts the element into the end', function () {
              expect(element.at(0).currentKey).to.equal(0);
              expect(element.at(0).value).to.equal('first val');
              expect(element.at(1).currentKey).to.equal(1);
              expect(element.at(1).value).to.equal('');
              expect(element.at(2).currentKey).to.equal(2);
              expect(element.at(2).value).to.equal('');
              expect(element.at(3).currentKey).to.equal(3);
              expect(element.at(3).value).to.equal('value');
            });
          });
        });
        context('insertEnd', function () {
          context('with only placeholders', function () {
            context('multiple', function () {
              const doc = new Document({});
              const element = new Element('emails', [], false, doc);
              before(function () {
                element.insertPlaceholder();
                element.insertPlaceholder();
                element.insertPlaceholder();
                element.insertEnd('', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0).currentKey).to.equal(0);
                expect(element.at(0).value).to.equal('');
                expect(element.at(1).currentKey).to.equal(1);
                expect(element.at(1).value).to.equal('');
                expect(element.at(2).currentKey).to.equal(2);
                expect(element.at(2).value).to.equal('');
                expect(element.at(3).currentKey).to.equal(3);
                expect(element.at(3).value).to.equal('value');
              });
            });
            context('one', function () {
              const doc = new Document({});
              const element = new Element('emails', [], false, doc);
              before(function () {
                element.insertPlaceholder();
                element.insertEnd('', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0).currentKey).to.equal(0);
                expect(element.at(0).value).to.equal('');
                expect(element.at(1).currentKey).to.equal(1);
                expect(element.at(1).value).to.equal('value');
              });
            });
          });
          context('with keys and placeholders', function () {
            const doc = new Document({});
            const element = new Element('emails', ['first val'], false, doc);
            before(function () {
              element.insertPlaceholder();
              element.insertPlaceholder();
              element.insertEnd('', 'value');
            });
            it('inserts the element into the end', function () {
              expect(element.at(0).currentKey).to.equal(0);
              expect(element.at(0).value).to.equal('first val');
              expect(element.at(1).currentKey).to.equal(1);
              expect(element.at(1).value).to.equal('');
              expect(element.at(2).currentKey).to.equal(2);
              expect(element.at(2).value).to.equal('');
              expect(element.at(3).currentKey).to.equal(3);
              expect(element.at(3).value).to.equal('value');
            });
          });
        });
      });
    });

    describe('#remove', function () {
      context('element to be removed is top-level', function () {
        context('and is added', function () {
          const doc = new Document({});
          const items = ['item0', 'item2'];
          const element = new Element('items', items, false, doc);

          before(function () {
            element.insertAfter(element.at(0), 'key3', 'item1');
            expect(element.generateObject()).to.deep.equal([
              'item0',
              'item1',
              'item2',
            ]);
            expect(element.generateOriginalObject()).to.deep.equal(items);
            element.at(1).remove();
          });
          it('deletes the element', function () {
            expect(element.generateObject()).to.deep.equal(items);
            expect(element.isModified()).to.equal(false);
          });
          it('updates keys correctly', function () {
            expect(element.at(0).currentKey).to.equal(0);
            expect(element.at(0).key).to.equal(0);
            expect(element.at(0).value).to.equal('item0');
            expect(element.at(1).currentKey).to.equal(1);
            expect(element.at(1).key).to.equal(1);
            expect(element.at(1).value).to.equal('item2');
          });
        });
        context('and is not added', function () {
          const doc = new Document({});
          const items = ['item0', 'item2'];
          const element = new Element(
            'items',
            ['item0', 'item1', 'item2'],
            false,
            doc
          );

          before(function () {
            element.at(1).remove();
          });
          it('deletes the element', function () {
            expect(element.generateObject()).to.deep.equal(items);
            expect(element.isModified()).to.equal(true);
          });
          it('maintains the original with generateOriginalObject', function () {
            expect(element.generateOriginalObject()).to.deep.equal([
              'item0',
              'item1',
              'item2',
            ]);
          });
          it('updates keys correctly', function () {
            expect(element.at(0).currentKey).to.equal(0);
            expect(element.at(0).value).to.equal('item0');
            expect(element.at(1).currentKey).to.equal(1);
            expect(element.at(1).key).to.equal(1);
            expect(element.at(1).value).to.equal('item1');
            expect(element.at(1).isRemoved()).to.equal(true);
            expect(element.at(2).key).to.equal(2);
            expect(element.at(2).value).to.equal('item2');
            expect(element.at(2).isEdited()).to.equal(false);
            expect(element.at(2).isRenamed()).to.equal(false);
          });
          it('sets flags correctly', function () {
            expect(element.at(0).isModified()).to.equal(false);
            expect(element.at(1).isRemoved()).to.equal(true);
            expect(element.at(2).isModified()).to.equal(false);
          });
        });
      });
      context('element to be removed is nested', function () {
        context('and is added', function () {
          const doc = new Document({});
          const items = [
            ['00', '01', '02'],
            ['10', '11', '12'],
          ];
          const element = new Element('items', items, false, doc);
          before(function () {
            element.at(0).insertAfter(element.at(0).at(1), '$new', '99');
            expect(element.generateObject()).to.deep.equal([
              ['00', '01', '99', '02'],
              ['10', '11', '12'],
            ]);
            element.at(0).at(2).remove();
          });
          it('reverts the document', function () {
            expect(element.generateObject()).to.deep.equal(items);
            expect(element.isModified()).to.equal(false);
          });
          it('updates keys correctly', function () {
            for (let i = 0; i < items.length; i++) {
              for (let j = 0; j < items[0].length; j++) {
                const parent = element.at(i);
                expect(parent.currentKey).to.equal(i);
                expect(parent.key).to.equal(i);
                expect(parent.at(j).currentKey).to.equal(j);
                expect(parent.at(j).key).to.equal(j);
                expect(parent.at(j).value).to.equal(`${i}${j}`);
              }
            }
          });
        });
        context('and is not added', function () {
          const doc = new Document({});
          const items = [
            ['00', '01', '99', '02'],
            ['10', '11', '12'],
          ];
          const element = new Element('items', items, false, doc);
          before(function () {
            element.at(0).at(2).remove();
          });
          it('removes the element from the document', function () {
            expect(element.generateObject()).to.deep.equal([
              ['00', '01', '02'],
              ['10', '11', '12'],
            ]);
            expect(element.isModified()).to.equal(true);
          });
          it('maintains the original with generateOriginalObject', function () {
            expect(element.generateOriginalObject()).to.deep.equal(items);
          });
          it('leaves the top level be', function () {
            expect(element.at(0).currentKey).to.equal(0);
            expect(element.at(0).key).to.equal(0);
            expect(element.at(0).isModified()).to.equal(true);
            expect(element.at(1).currentKey).to.equal(1);
            expect(element.at(1).key).to.equal(1);
            expect(element.at(1).isModified()).to.equal(false);
          });
          it('updates keys correctly', function () {
            const parent = element.at(0);
            expect(parent.at(0).currentKey).to.equal(0);
            expect(parent.at(0).value).to.equal('00');
            expect(parent.at(1).currentKey).to.equal(1);
            expect(parent.at(1).value).to.equal('01');
            expect(parent.at(2).currentKey).to.equal(2);
            expect(parent.at(2).value).to.equal('99');
            expect(parent.at(2).isRemoved()).to.equal(true);
            expect(parent.at(3).currentKey).to.equal(3);
            expect(parent.at(3).value).to.equal('02');
          });
          it('updates flags correctly', function () {
            const parent = element.at(0);
            expect(parent.at(0).isModified()).to.equal(false);
            expect(parent.at(1).isModified()).to.equal(false);
            expect(parent.at(2).isRemoved()).to.equal(true);
            expect(parent.at(3).isModified()).to.equal(false);
          });
        });
      });
    });

    describe('#revert', function () {
      context('element to be reverted is top-level', function () {
        context('and is added', function () {
          const doc = new Document({});
          const items = ['item0', 'item1', 'item2'];
          const element = new Element('items', items, false, doc);

          before(function () {
            element.insertAfter(element.at(0), '', 'item9');
            expect(element.generateObject()).to.deep.equal([
              'item0',
              'item9',
              'item1',
              'item2',
            ]);
            expect(element.generateOriginalObject()).to.deep.equal(items);
            element.revert();
          });
          it('reverts the document', function () {
            expect(element.generateObject()).to.deep.equal(items);
            expect(element.isModified()).to.equal(false);
          });
          it('updates keys correctly', function () {
            for (let i = 0; i < items.length; i++) {
              expect(element.at(i).currentKey).to.equal(i);
              expect(element.at(i).key).to.equal(i);
              expect(element.at(i).value).to.equal(`item${i}`);
            }
          });
        });
        context('and is removed', function () {
          const doc = new Document({});
          const items = ['item0', 'item1', 'item2', 'item3'];
          const element = new Element('items', items, false, doc);

          before(function () {
            element.at(1).remove();
            expect(element.generateObject()).to.deep.equal([
              'item0',
              'item2',
              'item3',
            ]);
            element.revert();
          });
          it('reverts the document', function () {
            expect(element.generateObject()).to.deep.equal(items);
            expect(element.isModified()).to.equal(false);
          });
          it('maintains the original with generateOriginalObject', function () {
            expect(element.generateOriginalObject()).to.deep.equal(items);
          });
          it('updates keys correctly', function () {
            for (let i = 0; i < items.length; i++) {
              expect(element.at(i).currentKey).to.equal(i);
              expect(element.at(i).key).to.equal(i);
              expect(element.at(i).value).to.equal(`item${i}`);
            }
          });
        });
      });
      context('element to be reverted is nested', function () {
        context('revert on top-level element', function () {
          context('and is added', function () {
            const doc = new Document({});
            const items = [
              ['00', '01', '02'],
              ['10', '11', '12'],
            ];
            const element = new Element('items', items, false, doc);
            before(function () {
              element.at(0).insertAfter(element.at(0).at(1), '$new', '99');
              expect(element.generateObject()).to.deep.equal([
                ['00', '01', '99', '02'],
                ['10', '11', '12'],
              ]);
              expect(element.generateOriginalObject()).to.deep.equal(items);
              element.revert();
            });
            it('reverts the document', function () {
              expect(element.generateObject()).to.deep.equal(items);
              expect(element.isModified()).to.equal(false);
            });
            it('updates keys correctly', function () {
              for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items[0].length; j++) {
                  const parent = element.at(i);
                  expect(parent.currentKey).to.equal(i);
                  expect(parent.key).to.equal(i);
                  expect(parent.at(j).currentKey).to.equal(j);
                  expect(parent.at(j).key).to.equal(j);
                  expect(parent.at(j).value).to.equal(`${i}${j}`);
                }
              }
            });
          });
          context('and is removed', function () {
            const doc = new Document({});
            const items = [
              ['00', '01', '02'],
              ['10', '11', '12'],
            ];
            const element = new Element('items', items, false, doc);
            before(function () {
              element.at(0).at(1).remove();
              expect(element.generateObject()).to.deep.equal([
                ['00', '02'],
                ['10', '11', '12'],
              ]);
              element.revert();
            });
            it('reverts the document', function () {
              expect(element.generateObject()).to.deep.equal(items);
              expect(element.isModified()).to.equal(false);
            });
            it('updates keys correctly', function () {
              for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items[0].length; j++) {
                  const parent = element.at(i);
                  expect(parent.currentKey).to.equal(i);
                  expect(parent.key).to.equal(i);
                  expect(parent.at(j).currentKey).to.equal(j);
                  expect(parent.at(j).key).to.equal(j);
                  expect(parent.at(j).value).to.equal(`${i}${j}`);
                }
              }
            });
          });
        });
        context('revert on nested element', function () {
          context('and is added', function () {
            const doc = new Document({});
            const items = [
              ['00', '01', '02'],
              ['10', '11', '12'],
            ];
            const element = new Element('items', items, false, doc);
            before(function () {
              element.at(0).insertAfter(element.at(0).at(1), '$new', '99');
              expect(element.generateObject()).to.deep.equal([
                ['00', '01', '99', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0).revert();
            });
            it('maintains the original with generateOriginalObject', function () {
              expect(element.generateOriginalObject()).to.deep.equal(items);
            });
            it('reverts the document', function () {
              expect(element.generateObject()).to.deep.equal(items);
              expect(element.isModified()).to.equal(false);
            });
            it('updates keys correctly', function () {
              for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items[0].length; j++) {
                  const parent = element.at(i);
                  expect(parent.currentKey).to.equal(i);
                  expect(parent.key).to.equal(i);
                  expect(parent.at(j).currentKey).to.equal(j);
                  expect(parent.at(j).key).to.equal(j);
                  expect(parent.at(j).value).to.equal(`${i}${j}`);
                }
              }
            });
          });
          context('and is removed', function () {
            const doc = new Document({});
            const items = [
              ['00', '01', '02'],
              ['10', '11', '12'],
            ];
            const element = new Element('items', items, false, doc);
            before(function () {
              element.at(0).at(1).remove();
              expect(element.generateObject()).to.deep.equal([
                ['00', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0).revert();
            });
            it('maintains the original with generateOriginalObject', function () {
              expect(element.generateOriginalObject()).to.deep.equal(items);
            });
            it('reverts the document', function () {
              expect(element.generateObject()).to.deep.equal(items);
              expect(element.isModified()).to.equal(false);
            });
            it('updates keys correctly', function () {
              for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items[0].length; j++) {
                  const parent = element.at(i);
                  expect(parent.currentKey).to.equal(i);
                  expect(parent.key).to.equal(i);
                  expect(parent.at(j).currentKey).to.equal(j);
                  expect(parent.at(j).key).to.equal(j);
                  expect(parent.at(j).value).to.equal(`${i}${j}`);
                }
              }
            });
          });
        });
        context('revert on most nested element', function () {
          context('and is added', function () {
            const doc = new Document({});
            const items = [
              ['00', '01', '02'],
              ['10', '11', '12'],
            ];
            const element = new Element('items', items, false, doc);
            before(function () {
              element.at(0).insertAfter(element.at(0).at(1), '$new', '99');
              expect(element.generateObject()).to.deep.equal([
                ['00', '01', '99', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0).at(2).revert();
            });
            it('reverts the document', function () {
              expect(element.generateObject()).to.deep.equal(items);
              expect(element.isModified()).to.equal(false);
            });
            it('updates keys correctly', function () {
              for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items[0].length; j++) {
                  const parent = element.at(i);
                  expect(parent.currentKey).to.equal(i);
                  expect(parent.key).to.equal(i);
                  expect(parent.at(j).currentKey).to.equal(j);
                  expect(parent.at(j).key).to.equal(j);
                  expect(parent.at(j).value).to.equal(`${i}${j}`);
                }
              }
            });
          });
          context('and is removed', function () {
            const doc = new Document({});
            const items = [
              ['00', '01', '02'],
              ['10', '11', '12'],
            ];
            const element = new Element('items', items, false, doc);
            before(function () {
              element.at(0).at(1).remove();
              expect(element.generateObject()).to.deep.equal([
                ['00', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0).at(1).revert();
            });
            it('maintains the original with generateOriginalObject', function () {
              expect(element.generateOriginalObject()).to.deep.equal(items);
            });
            it('reverts the document', function () {
              expect(element.generateObject()).to.deep.equal(items);
              expect(element.isModified()).to.equal(false);
            });
            it('updates keys correctly', function () {
              for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items[0].length; j++) {
                  const parent = element.at(i);
                  expect(parent.currentKey).to.equal(i);
                  expect(parent.key).to.equal(i);
                  expect(parent.at(j).currentKey).to.equal(j);
                  expect(parent.at(j).key).to.equal(j);
                  expect(parent.at(j).value).to.equal(`${i}${j}`);
                }
              }
            });
          });
        });
      });
    });

    describe('#cancel', function () {
      const doc = new Document({});
      const items = [
        ['00', '01', '02'],
        ['10', '11', '12'],
      ];
      const element = new Element('items', items, false, doc);
      before(function () {
        element.at(1).at(0).remove();
        element.at(0).insertAfter(element.at(0).at(0), '$new', '99');
        expect(element.generateObject()).to.deep.equal([
          ['00', '99', '01', '02'],
          ['11', '12'],
        ]);
        element.cancel();
      });
      it('maintains the original with generateOriginalObject', function () {
        expect(element.generateOriginalObject()).to.deep.equal(items);
      });
      it('reverts the document', function () {
        expect(element.generateObject()).to.deep.equal(items);
        expect(element.isModified()).to.equal(false);
      });
      it('updates keys correctly', function () {
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < items[0].length; j++) {
            const parent = element.at(i);
            expect(parent.currentKey).to.equal(i);
            expect(parent.key).to.equal(i);
            expect(parent.at(j).currentKey).to.equal(j);
            expect(parent.at(j).key).to.equal(j);
            expect(parent.at(j).value).to.equal(`${i}${j}`);
          }
        }
      });
    });
  });
});
