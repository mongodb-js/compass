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
import { Document, Element, ElementEvents } from '../src/';
import type { ElementList } from '../src/element';
import {
  DATE_FORMAT,
  DEFAULT_VISIBLE_ELEMENTS,
  isValueExpandable,
} from '../src/element';
import moment from 'moment';
import Sinon from 'sinon';

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
        expect(element.get('name')?.currentValue).to.equal('test');
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
      const child = element.elements?.at(0);

      before(function () {
        child?.rename('testing');
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
        expect(element.at(0)?.currentValue).to.equal('item0');
        expect(element.at(1)?.currentValue).to.equal('item1');
      });
    });

    context('when a non-added element has been removed', function () {
      const element = new Element('key', ['item0', 'item1']);

      before(function () {
        element.at(0)?.remove();
      });

      it('returns the original elements', function () {
        expect(element.at(0)?.currentValue).to.equal('item0');
        expect(element.at(0)?.currentKey).to.equal(0);
        expect(element.at(0)?.isRemoved()).to.equal(true);
        expect(element.at(1)?.currentValue).to.equal('item1');
        /* Since element removed was not added, keys not modified */
        expect(element.at(1)?.currentKey).to.equal(1);
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
      const test1 = element.insertEnd('', 'test1');
      element.insertEnd('', 'test2');
      const test3 = element.insertEnd('', 'test3');
      element.insertEnd('', 'test4');
      const test5 = element.insertEnd('', 'test5');

      before(function () {
        expect(element.generateObject()).to.deep.equal([
          'test1',
          'test2',
          'test3',
          'test4',
          'test5',
        ]);
        element.elements?.remove(test1);
        element.elements?.remove(test3);
        element.elements?.remove(test5);
      });

      it('returns the correct elements', function () {
        expect(element.at(0)?.currentValue).to.equal('test2');
        expect(element.at(0)?.currentKey).to.equal(0);
        expect(element.at(1)?.currentValue).to.equal('test4');
        expect(element.at(1)?.currentKey).to.equal(1);
        expect(element.at(2)).to.equal(undefined);
      });
    });

    context('when the element value is changed', function () {
      const element = new Element('key', ['test']);
      const child = element.elements?.at(0);

      before(function () {
        child?.edit('test2');
      });

      it('returns the new element for the index', function () {
        expect(element.at(0)).to.equal(child);
        expect(element.at(0)?.currentValue).to.equal('test2');
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
      const element = new Element('string', 'testing', doc);
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
        const element = new Element('test', ['a', 'b'], doc);

        it('returns the array', function () {
          expect(element.generateObject()).to.deep.equal(['a', 'b']);
        });
      });

      context('when the type is object', function () {
        const element = new Element('test', { test: 'value' }, doc);

        it('returns the array', function () {
          expect(element.generateObject()).to.deep.equal({ test: 'value' });
        });
      });
    });

    context('when the element has no child elements', function () {
      context('when the current value is a', function () {
        const element = new Element('test', 'a', doc);

        it('returns "a"', function () {
          expect(element.generateObject()).to.deep.equal('a');
        });
      });

      context('when the current value is "b"', function () {
        const element = new Element('test', 'b', doc);

        it('returns 1', function () {
          expect(element.generateObject()).to.deep.equal('b');
        });
      });

      context('when the current value is ""', function () {
        const element = new Element('test', '', doc);

        it('returns ""', function () {
          expect(element.generateObject()).to.equal('');
        });
      });

      context('when the current value is null', function () {
        const element = new Element('test', null, doc);

        it('returns null', function () {
          expect(element.generateObject()).to.equal(null);
        });
      });

      context('when the current value is undefined', function () {
        const element = new Element('test', undefined, doc);

        it('returns undefined', function () {
          expect(element.generateObject()).to.equal(undefined);
        });
      });

      context('when the current value is false', function () {
        const element = new Element('test', false, doc);

        it('returns false', function () {
          expect(element.generateObject()).to.equal(false);
        });
      });

      context('when the current value is truthy', function () {
        const element = new Element('test', 'test', doc);

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
        const element = new Element('test', ['a', 'b'], doc);

        it('returns the array', function () {
          expect(element.generateOriginalObject()).to.deep.equal(['a', 'b']);
        });
      });

      context('when the type is object', function () {
        const element = new Element('test', { test: 'value' }, doc);

        it('returns the array', function () {
          expect(element.generateOriginalObject()).to.deep.equal({
            test: 'value',
          });
        });
      });
    });

    context('when the element has no child elements', function () {
      context('when the current value is "a"', function () {
        const element = new Element('test', 'a', doc);

        it('returns 0', function () {
          expect(element.generateOriginalObject()).to.equal('a');
        });
      });

      context('when the current value is "b"', function () {
        const element = new Element('test', 'b', doc);

        it('returns 1', function () {
          expect(element.generateOriginalObject()).to.deep.equal('b');
        });
      });

      context('when the value is ""', function () {
        const element = new Element('test', '', doc);

        it('returns ""', function () {
          expect(element.generateOriginalObject()).to.equal('');
        });
      });

      context('when the value is null', function () {
        const element = new Element('test', null, doc);

        it('returns null', function () {
          expect(element.generateOriginalObject()).to.equal(null);
        });
      });

      context('when the value is undefined', function () {
        const element = new Element('test', undefined, doc);

        it('returns undefined', function () {
          expect(element.generateOriginalObject()).to.equal(undefined);
        });
      });

      context('when the value is false', function () {
        const element = new Element('test', false, doc);

        it('returns false', function () {
          expect(element.generateOriginalObject()).to.equal(false);
        });
      });

      context('when the value is a string', function () {
        const element = new Element('test', 'test', doc);

        it('returns the value', function () {
          expect(element.generateOriginalObject()).to.equal('test');
        });
      });

      context('when the current value is truthy', function () {
        const element = new Element('test', false, doc);
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
      const element = new Element('email', { work: 'work@example.com' }, doc);

      before(function () {
        element.insertEnd('home', 'home@example.com');
      });

      it('adds the new embedded element', function () {
        expect(element.elements?.at(1)?.key).to.equal('home');
        expect(element.elements?.at(1)?.value).to.equal('home@example.com');
      });

      it('flags the new element as added', function () {
        expect(element.elements?.at(1)?.isAdded()).to.equal(true);
      });
    });
    context(
      'when the embedded element is an array of embedded documents',
      function () {
        const doc = new Document({});
        const element = new Element('emails', [], doc);

        before(function () {
          element.insertEnd('', '').edit({ home: 'home@example.com' });
        });

        it('adds the new embedded element', function () {
          expect(element.elements?.at(0)?.elements?.at(0)?.key).to.equal(
            'home'
          );
          expect(element.elements?.at(0)?.elements?.at(0)?.value).to.equal(
            'home@example.com'
          );
        });

        it('flags the new elements as added', function () {
          expect(element.elements?.at(0)?.isAdded()).to.equal(true);
          expect(element.elements?.at(0)?.elements?.at(0)?.isAdded()).to.equal(
            true
          );
        });

        it('does not flag the new elements as edited', function () {
          expect(element.elements?.at(0)?.isEdited()).to.equal(false);
          expect(element.elements?.at(0)?.elements?.at(0)?.isEdited()).to.equal(
            false
          );
        });

        it('does not flag the new elements as renamed', function () {
          expect(element.elements?.at(0)?.isRenamed()).to.equal(false);
          expect(
            element.elements?.at(0)?.elements?.at(0)?.isRenamed()
          ).to.equal(false);
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
        doc
      );

      before(function () {
        element.insertAfter(element.at(0)!, 'key1', 'item1');
      });

      it('adds the new embedded element', function () {
        expect(element.elements?.at(1)?.key).to.equal('key1');
        expect(element.elements?.at(1)?.value).to.equal('item1');
      });

      it('flags the new element as added', function () {
        expect(element.elements?.at(1)?.isAdded()).to.equal(true);
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

  describe('#isEditable', function () {
    context(
      'when the key is _id and the value is a nested object',
      function () {
        const doc = new Document({});
        const element = new Element('_id', {}, doc);
        element.insertEnd('subkey', {});
        element.get('subkey')?.insertEnd('subsubkey', 'test value');
        context('#isValueEditable', function () {
          it('top level element returns false', function () {
            expect(element.isValueEditable()).to.equal(false);
          });
          it('sub element returns false', function () {
            expect(element.get('subkey')?.isValueEditable()).to.equal(false);
          });
          it('sub sub element returns false', function () {
            expect(
              element.get('subkey')?.get('subsubkey')?.isValueEditable()
            ).to.equal(false);
          });
        });
        context('#isKeyEditable', function () {
          it('top level element returns false', function () {
            expect(element.isKeyEditable()).to.equal(false);
            expect(element.isParentEditable()).to.equal(true);
          });
          it('sub element returns false', function () {
            expect(element.get('subkey')?.isKeyEditable()).to.equal(false);
            expect(element.get('subkey')?.isParentEditable()).to.equal(false);
          });
          it('sub sub element returns false', function () {
            expect(
              element.get('subkey')?.get('subsubkey')?.isKeyEditable()
            ).to.equal(false);
            expect(
              element.get('subkey')?.get('subsubkey')?.isParentEditable()
            ).to.equal(false);
          });
        });
      }
    );

    // COMPASS-6160 regression test.
    context('when the key is _id and it is not at the top level', function () {
      const doc = new Document({});
      const element = new Element('root', {}, doc);
      element.insertEnd('subkey', {});
      element.get('subkey')?.insertEnd('_id', 'test value');
      context('#isValueEditable', function () {
        it('top level element returns false', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
        it('sub element returns true', function () {
          expect(element.get('subkey')?.isValueEditable()).to.equal(true);
        });
        it('sub sub element returns true', function () {
          expect(element.get('subkey')?.get('_id')?.isValueEditable()).to.equal(
            true
          );
        });
      });
      context('#isKeyEditable', function () {
        it('top level element returns true', function () {
          expect(element.isKeyEditable()).to.equal(true);
          expect(element.isParentEditable()).to.equal(true);
        });
        it('sub element returns true', function () {
          expect(element.get('subkey')?.isKeyEditable()).to.equal(true);
          expect(element.get('subkey')?.isParentEditable()).to.equal(true);
        });
        it('sub sub _id element returns true', function () {
          expect(element.get('subkey')?.get('_id')?.isKeyEditable()).to.equal(
            true
          );
          expect(
            element.get('subkey')?.get('_id')?.isParentEditable()
          ).to.equal(true);
        });
      });
    });

    context('when the key is something not _id', function () {
      const element = new Element('test', {});
      element.insertEnd('subkey', {});
      element.get('subkey')?.insertEnd('subsubkey', 'test value');
      context('#isValueEditable', function () {
        it('top level element returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
        it('sub element returns true', function () {
          expect(element.get('subkey')?.isValueEditable()).to.equal(true);
        });
        it('sub sub element returns true', function () {
          expect(
            element.get('subkey')?.get('subsubkey')?.isValueEditable()
          ).to.equal(true);
        });
      });
      context('#isKeyEditable', function () {
        it('top level element returns true', function () {
          expect(element.isKeyEditable()).to.equal(true);
          expect(element.isParentEditable()).to.equal(true);
        });
        it('sub element returns true', function () {
          expect(element.get('subkey')?.isKeyEditable()).to.equal(true);
          expect(element.get('subkey')?.isParentEditable()).to.equal(true);
        });
        it('sub sub element returns true', function () {
          expect(
            element.get('subkey')?.get('subsubkey')?.isKeyEditable()
          ).to.equal(true);
          expect(
            element.get('subkey')?.get('subsubkey')?.isParentEditable()
          ).to.equal(true);
        });
      });
    });
  });

  describe('#isValueEditable', function () {
    context('when the key is _id', function () {
      context('when the element is not added with no parent', function () {
        const element = new Element('_id', 'test');

        it('returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
      });

      context('when the element is not added with a parent', function () {
        const doc = new Document({});
        const element = new Element('_id', 'test', doc);

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the element is added', function () {
        const element = new Element('_id', 'test', null, true);

        it('returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
      });
    });

    context('when the key is not _id', function () {
      context('when the type is ObjectId', function () {
        const element = new Element('name', new ObjectId());

        it('returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
      });

      context('when the type is binary', function () {
        const element = new Element('name', Binary.createFromBase64('test'));

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is code', function () {
        const element = new Element('name', new Code('test'));

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is min key', function () {
        const element = new Element('name', new MinKey());

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is max key', function () {
        const element = new Element('name', new MaxKey());

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is a timestamp', function () {
        const element = new Element('name', new Timestamp({ t: 0, i: 0 }));

        it('returns false', function () {
          expect(element.isValueEditable()).to.equal(false);
        });
      });

      context('when the type is editable', function () {
        const element = new Element('name', 'test');

        it('returns true', function () {
          expect(element.isValueEditable()).to.equal(true);
        });
      });
    });
  });

  describe('#isValueDecrypted', function () {
    it('returns false when the element was not decrypted and is not nested', function () {
      const doc = new Document({ a: 1 });
      expect(doc.get('a')?.isValueDecrypted()).to.equal(false);
    });

    it('returns false when the element was not decrypted and is nested', function () {
      const doc = new Document({ a: { b: 1 } });
      expect(doc.get('a')?.get('b')?.isValueDecrypted()).to.equal(false);
    });

    it('returns true when the element was decrypted and is not nested', function () {
      const doc = new Document({
        a: { b: 1 },
        [Symbol.for('@@mdb.decryptedKeys')]: ['a'],
      });
      expect(doc.get('a')?.isValueDecrypted()).to.equal(true);
      expect(doc.get('a')?.get('b')?.isValueDecrypted()).to.equal(false);
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
      expect(doc.get('a')?.isValueDecrypted()).to.equal(false);
      expect(doc.get('a')?.get('b')?.isValueDecrypted()).to.equal(true);
      expect(doc.get('a')?.get('c')?.isValueDecrypted()).to.equal(false);
      expect(doc.get('a')?.get('d')?.isValueDecrypted()).to.equal(false);
      expect(doc.get('a')?.get('d')?.at(0)?.isValueDecrypted()).to.equal(true);
      expect(doc.get('a')?.get('d')?.at(1)?.isValueDecrypted()).to.equal(false);
    });
  });

  describe('#containsDecryptedChildren', function () {
    it('returns false when the element was not decrypted and is not nested', function () {
      const doc = new Document({ a: 1 });
      expect(doc.get('a')?.containsDecryptedChildren()).to.equal(false);
    });

    it('returns false when the element was not decrypted and is nested', function () {
      const doc = new Document({ a: { b: 1 } });
      expect(doc.get('a')?.get('b')?.containsDecryptedChildren()).to.equal(
        false
      );
    });

    it('returns true when the element was decrypted and is not nested', function () {
      const doc = new Document({
        a: { b: 1 },
        [Symbol.for('@@mdb.decryptedKeys')]: ['a'],
      });
      expect(doc.get('a')?.containsDecryptedChildren()).to.equal(true);
      expect(doc.get('a')?.get('b')?.containsDecryptedChildren()).to.equal(
        false
      );
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
      expect(doc.get('a')?.containsDecryptedChildren()).to.equal(true);
      expect(doc.get('a')?.get('b')?.containsDecryptedChildren()).to.equal(
        true
      );
      expect(doc.get('a')?.get('c')?.containsDecryptedChildren()).to.equal(
        false
      );
      expect(doc.get('a')?.get('d')?.containsDecryptedChildren()).to.equal(
        true
      );
      expect(
        doc.get('a')?.get('d')?.at(0)?.containsDecryptedChildren()
      ).to.equal(true);
      expect(
        doc.get('a')?.get('d')?.at(1)?.containsDecryptedChildren()
      ).to.equal(false);
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
        expect(doc.get('a')?.isKeyEditable()).to.equal(false);
        expect(doc.get('a')?.get('b')?.isKeyEditable()).to.equal(false);
        expect(doc.get('a')?.get('c')?.isKeyEditable()).to.equal(true);
      });
    });
  });

  describe('#isModified', function () {
    context('when the element has no children', function () {
      context('when the element is not modified', function () {
        const element = new Element('name', 'Aphex Twin');

        it('returns false', function () {
          expect(element.isModified()).to.equal(false);
        });
      });

      context('when the element is added', function () {
        const element = new Element('name', 'Aphex Twin', null, true);

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is edited', function () {
        const element = new Element('name', 'Aphex Twin');

        before(function () {
          element.edit('APX');
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is removed', function () {
        const element = new Element('name', 'Aphex Twin');

        before(function () {
          element.remove();
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when the element is reverted', function () {
        const element = new Element('name', 'Aphex Twin');

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
        const element = new Element('names', []);

        before(function () {
          element.insertEnd('', 'testing');
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when a child element is edited', function () {
        const element = new Element('names', ['testing']);

        before(function () {
          element.elements?.at(0)?.edit('test');
        });

        it('returns true', function () {
          expect(element.isModified()).to.equal(true);
        });
      });

      context('when a child element is removed', function () {
        const element = new Element('names', ['testing']);

        before(function () {
          element.elements?.at(0)?.remove();
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
        const element = new Element('name', 'Pineapple');

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is added', function () {
        const element = new Element('name', 'Pineapple', null, true);

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is edited', function () {
        const element = new Element('name', 'Pineapple');

        before(function () {
          element.edit('not pineapple');
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is removed', function () {
        const element = new Element('name', 'Pineapple');

        before(function () {
          element.remove();
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is renamed', function () {
        const element = new Element('name', 'Pineapple');

        before(function () {
          element.edit('not pineapple');
        });

        it('returns true', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is reverted', function () {
        const element = new Element('name', 'Pineapple');

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
        const element = new Element('names', ['testing']);

        before(function () {
          element.elements?.at(0)?.edit('test');
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when a child element is renamed', function () {
        const element = new Element('names', ['testing']);

        before(function () {
          element.elements?.at(0)?.remove();
        });

        it('returns false', function () {
          expect(element.isRenamed()).to.equal(false);
        });
      });

      context('when the element is renamed', function () {
        const element = new Element('names', ['testing']);

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
      const element = new Element('name', 'Aphex Twin');

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
      const element = new Element('albums', ['Windowlicker']);

      it('sets the key', function () {
        expect(element.key).to.equal('albums');
      });

      it('sets the current key', function () {
        expect(element.currentKey).to.equal('albums');
      });

      it('sets the elements', function () {
        expect(element.elements?.size).to.equal(1);
      });

      it('sets the element type', function () {
        expect(element.type).to.equal('Array');
      });

      it('sets the element current type', function () {
        expect(element.currentType).to.equal('Array');
      });
    });

    context('when the element is an embedded document', function () {
      const element = new Element('email', { work: 'test@example.com' });

      it('sets the key', function () {
        expect(element.key).to.equal('email');
      });

      it('sets the current key', function () {
        expect(element.currentKey).to.equal('email');
      });

      it('sets the elements', function () {
        expect(element.elements?.size).to.equal(1);
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
    const element = new Element('val', 1);

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
      const element = new Element('val', date);

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
      const element = new Element('val', oid);

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
      const element = new Element('val', new Int32(10));

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
      const element = new Element('val', new Double(10.0));

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
      const element = new Element('val', Long.fromNumber(10));

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
      const element = new Element('val', new Decimal128('10.0'));

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
      const element = new Element('val', { test: 'value' });

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
            expect(element.elements?.at(0)?.currentKey).to.equal('test');
            expect(element.elements?.at(0)?.currentValue).to.equal('value');
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
          const element = new Element('name', 'Aphex Twin');

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
          const element = new Element('name', 'Aphex Twin');

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
          const element = new Element('name', 'Aphex Twin');

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
          const element = new Element('name', 'Aphex Twin');

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
            const element = new Element('email', 'test@example.com');

            before(function () {
              element.edit({});
            });

            it('changes the document to an embedded document', function () {
              expect(element.elements?.size).to.equal(0);
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
            const element = new Element('email', 'test@example.com');

            before(function () {
              element.edit({ home: 'home@example.com' });
            });

            it('changes the document to an embedded document', function () {
              expect(element.elements?.size).to.equal(1);
              expect(element.elements?.at(0)?.key).to.equal('home');
              expect(element.elements?.at(0)?.value).to.equal(
                'home@example.com'
              );
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
          const element = new Element('email', 'test@example.com');

          before(function () {
            element.edit([]);
          });

          it('changes the document to an embedded document', function () {
            expect(element.elements?.size).to.equal(0);
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
          const element = new Element('email', 'test@example.com');

          before(function () {
            element.edit(['home@example.com']);
          });

          it('changes the document to an embedded document', function () {
            expect(element.elements?.size).to.equal(1);
            expect(element.elements?.at(0)?.key).to.equal(0);
            expect(element.elements?.at(0)?.value).to.equal('home@example.com');
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
        const element = new Element('name', 'Aphex Twin');

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
    const element = new Element('name', 'Aphex Twin');

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
      const element = new Element('name', 'Aphex Twin');

      before(function () {
        element.remove();
      });

      it('flags the element as removed', function () {
        expect(element.isRemoved()).to.equal(true);
      });
    });

    context('when the element has been edited', function () {
      const element = new Element('name', 'Aphex Twin');

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
      const element = new Element('name', 'Aphex Twin');

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
      const element = new Element('name', 'Aphex Twin');

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
      const element = new Element('email', { work: 'work@example.com' });

      before(function () {
        element.insertEnd('home', 'home@example.com');
        element.revert();
      });

      it('sets the keys back to the original', function () {
        expect(element.key).to.equal('email');
        expect(element.currentKey).to.equal('email');
      });

      it('sets the elements back to the original', function () {
        expect(element.elements?.size).to.equal(1);
        expect(element.elements?.at(0)?.key).to.equal('work');
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
        const element = new Element('email', 'test@example.com');

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
          expect(element).to.not.haveOwnProperty('elements');
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
        const element = new Element('email', 'test@example.com');

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
          expect(element).to.not.haveOwnProperty('elements');
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

    context('when the element parent is not defined', function () {
      it('when element is new addition', function () {
        const element = new Element('name', undefined, undefined, true);
        expect(() => element.revert()).to.not.throw();
        expect(element.key).to.equal('name');
        expect(element.value).to.equal(undefined);
      });

      it('when element is not new addition', function () {
        const element = new Element('name', undefined, undefined, false);
        expect(() => element.revert()).to.not.throw();
        expect(element.key).to.equal('name');
        expect(element.value).to.equal(undefined);
      });
    });
  });

  describe('modifying arrays', function () {
    describe('#insertEnd', function () {
      const doc = new Document({});
      const items = ['work@example.com'];
      const element = new Element('emails', items, doc);
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
          expect(element.elements?.at(i)?.currentKey).to.equal(i);
          expect(element.elements?.at(i)?.key).to.equal(i);
          expect(element.elements?.at(i)?.value).to.equal(finalArray[i]);
        }
      });
      it('flags the right elements as added', function () {
        expect(element.elements?.at(0)?.isAdded()).to.equal(false);
        expect(element.elements?.at(1)?.isAdded()).to.equal(true);
        expect(element.elements?.at(2)?.isAdded()).to.equal(true);
        expect(element.elements?.at(3)?.isAdded()).to.equal(true);
      });
      it('flags the right elements as modified', function () {
        expect(element.elements?.at(0)?.isModified()).to.equal(false);
        expect(element.elements?.at(1)?.isModified()).to.equal(true);
        expect(element.elements?.at(2)?.isModified()).to.equal(true);
        expect(element.elements?.at(3)?.isModified()).to.equal(true);
      });
      it('flags the right elements as edited', function () {
        expect(element.elements?.at(0)?.isEdited()).to.equal(false);
        expect(element.elements?.at(1)?.isEdited()).to.equal(false);
        expect(element.elements?.at(2)?.isEdited()).to.equal(false);
        expect(element.elements?.at(3)?.isEdited()).to.equal(false);
      });
      it('maintains the original with generateOriginalObject', function () {
        expect(element.generateOriginalObject()).to.deep.equal(items);
      });
    });

    describe('#insertAfter', function () {
      context('inserting into the array', function () {
        const doc = new Document({});
        const element = new Element('emails', ['item0'], doc);
        before(function () {
          element.insertAfter(element.at(0)!, 'key3', 'item3');
          element.insertAfter(element.at(0)!, 'ignore', 'item1');
          element.insertAfter(element.at(1)!, '', 'item2');
        });
        it('adds the new embedded elements', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.elements?.at(i)?.currentKey).to.equal(i);
            expect(element.elements?.at(i)?.value).to.equal(`item${i}`);
          }
        });
        it('flags the new element as added', function () {
          expect(element.elements?.at(1)?.isAdded()).to.equal(true);
          expect(element.elements?.at(2)?.isAdded()).to.equal(true);
          expect(element.elements?.at(3)?.isAdded()).to.equal(true);
        });
        it('flags the original element as not modified', function () {
          expect(element.elements?.at(0)?.isModified()).to.equal(false);
        });
        it('flags the original element as not renamed', function () {
          expect(element.elements?.at(0)?.isRenamed()).to.equal(false);
        });
      });
      context('inserting into the middle of the array', function () {
        const doc = new Document({});
        const element = new Element('items', ['item0', 'item2', 'item3'], doc);

        before(function () {
          element.insertAfter(element.at(0)!, 'key3', 'item1');
        });
        it('inserts the element into the list with the correct key', function () {
          expect(element.at(1)?.currentKey).to.equal(1);
          expect(element.at(1)?.key).to.equal(1);
          expect(element.at(1)?.value).to.equal('item1');
        });
        it('updates the currentKey of subsequent elements', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i)?.currentKey).to.equal(i);
            expect(element.at(i)?.value).to.equal(`item${i}`);
          }
        });
        it('correctly marks elements as modified', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i)?.isModified()).to.equal(i === 1);
          }
        });
      });
      context('inserting into the end of the array', function () {
        const doc = new Document({});
        const element = new Element('emails', ['item0', 'item1', 'item2'], doc);
        before(function () {
          element.insertAfter(element.at(2)!, 'key3', 'item3');
        });
        it('inserts the element into the list with the correct key', function () {
          expect(element.at(3)?.currentKey).to.equal(3);
          expect(element.at(3)?.value).to.equal('item3');
        });
        it('updates the key and currentKey of subsequent elements', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i)?.currentKey).to.equal(i);
            expect(element.at(i)?.value).to.equal(`item${i}`);
          }
        });
        it('correctly marks elements as modified', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i)?.isModified()).to.equal(i === 3);
          }
        });
      });
    });

    describe('#insertPlaceholder', function () {
      context('into an empty array', function () {
        const doc = new Document({});
        const element = new Element('emails', [], doc);
        before(function () {
          element.insertPlaceholder();
        });
        it('array has one empty string element', function () {
          expect(element.at(0)?.currentKey).to.equal(0);
          expect(element.at(0)?.value).to.equal('');
          expect(element.elements?.size).to.equal(1);
        });
        it('element is modified', function () {
          expect(element.at(0)?.isModified()).to.equal(true);
        });
      });
      context('into a full array', function () {
        const doc = new Document({});
        const element = new Element('emails', ['item0', 'item1', 'item2'], doc);
        before(function () {
          element.insertPlaceholder();
        });
        it('inserts the element into the end', function () {
          expect(element.at(3)?.currentKey).to.equal(3);
          expect(element.at(3)?.value).to.equal('');
        });
        it('keeps the other elements the same', function () {
          expect(element.elements?.size).to.equal(4);
          for (let i = 0; i < 3; i++) {
            expect(element.at(i)?.currentKey).to.equal(i);
            expect(element.at(i)?.value).to.equal(`item${i}`);
          }
        });
        it('element is modified', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i)?.isModified()).to.equal(i === 3);
          }
        });
      });
      context('into a number array', function () {
        const doc = new Document({});
        const element = new Element('emails', [25, 123], doc);
        before(function () {
          element.insertPlaceholder();
        });
        it('inserts a number type element into the end', function () {
          expect(element.at(2)?.value).to.deep.equal(new Int32(0));
        });
      });
      context('into a date array', function () {
        const doc = new Document({});
        const element = new Element('emails', [new Date(), new Date()], doc);
        before(function () {
          element.insertPlaceholder();
        });
        it('inserts a date type element into the end', function () {
          expect(element.at(2)?.value?.toString()).to.equal(
            new Date(0).toString()
          );
          expect(element.at(2)?.value).to.deep.equal(new Date(0));
        });
      });
      context('into an array of arrays', function () {
        const doc = new Document({});
        const element = new Element(
          'emails',
          [
            ['a', 'b'],
            ['c', 'd'],
          ],
          doc
        );
        before(function () {
          element.insertPlaceholder();
        });
        it('inserts an array type element into the end', function () {
          expect(element.elements?.size).to.equal(3);
          expect(element.elements?.at(1)?.elements?.at(0)?.value).to.equal('c');
          expect(element.elements?.at(2)?.currentType).to.equal('Array');
          expect(element.elements?.at(2)?.elements?.size).to.equal(0);
          expect(element.generateObject()).to.deep.equal([
            ['a', 'b'],
            ['c', 'd'],
            [],
          ]);
        });
      });
      context('into an array of objects', function () {
        const doc = new Document({});
        const element = new Element(
          'fruits',
          [
            {
              name: 'pineapple',
            },
            {
              name: 'orange',
            },
          ],
          doc
        );
        before(function () {
          element.insertPlaceholder();
        });
        it('inserts an object type element into the end', function () {
          expect(element.elements?.size).to.equal(3);
          expect(
            element.elements?.at(1)?.elements?.get('name')?.value
          ).to.equal('orange');
          expect(element.elements?.at(2)?.currentType).to.equal('Object');
          expect(element.elements?.at(2)?.elements?.size).to.equal(0);
          expect(element.generateObject()).to.deep.equal([
            {
              name: 'pineapple',
            },
            {
              name: 'orange',
            },
            {},
          ]);
        });
      });
      context('insert after placeholders', function () {
        context('insertAfter', function () {
          context('with only placeholders', function () {
            context('multiple', function () {
              const doc = new Document({});
              const element = new Element('emails', [], doc);
              before(function () {
                element.insertPlaceholder();
                element.insertPlaceholder();
                const e = element.insertPlaceholder();
                element.insertAfter(e, '', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0)?.currentKey).to.equal(0);
                expect(element.at(0)?.value).to.equal('');
                expect(element.at(1)?.currentKey).to.equal(1);
                expect(element.at(1)?.value).to.equal('');
                expect(element.at(2)?.currentKey).to.equal(2);
                expect(element.at(2)?.value).to.equal('');
                expect(element.at(3)?.currentKey).to.equal(3);
                expect(element.at(3)?.value).to.equal('value');
              });
            });
            context('one', function () {
              const doc = new Document({});
              const element = new Element('emails', [], doc);
              before(function () {
                const e = element.insertPlaceholder();
                element.insertAfter(e, '', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0)?.currentKey).to.equal(0);
                expect(element.at(0)?.value).to.equal('');
                expect(element.at(1)?.currentKey).to.equal(1);
                expect(element.at(1)?.value).to.equal('value');
              });
            });
          });
          context('with keys and placeholders', function () {
            const doc = new Document({});
            const element = new Element('emails', ['first val'], doc);
            before(function () {
              element.insertPlaceholder();
              const e = element.insertPlaceholder();
              element.insertAfter(e, '', 'value');
            });
            it('inserts the element into the end', function () {
              expect(element.at(0)?.currentKey).to.equal(0);
              expect(element.at(0)?.value).to.equal('first val');
              expect(element.at(1)?.currentKey).to.equal(1);
              expect(element.at(1)?.value).to.equal('');
              expect(element.at(2)?.currentKey).to.equal(2);
              expect(element.at(2)?.value).to.equal('');
              expect(element.at(3)?.currentKey).to.equal(3);
              expect(element.at(3)?.value).to.equal('value');
            });
          });
        });
        context('insertEnd', function () {
          context('with only placeholders', function () {
            context('multiple', function () {
              const doc = new Document({});
              const element = new Element('emails', [], doc);
              before(function () {
                element.insertPlaceholder();
                element.insertPlaceholder();
                element.insertPlaceholder();
                element.insertEnd('', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0)?.currentKey).to.equal(0);
                expect(element.at(0)?.value).to.equal('');
                expect(element.at(1)?.currentKey).to.equal(1);
                expect(element.at(1)?.value).to.equal('');
                expect(element.at(2)?.currentKey).to.equal(2);
                expect(element.at(2)?.value).to.equal('');
                expect(element.at(3)?.currentKey).to.equal(3);
                expect(element.at(3)?.value).to.equal('value');
              });
            });
            context('one', function () {
              const doc = new Document({});
              const element = new Element('emails', [], doc);
              before(function () {
                element.insertPlaceholder();
                element.insertEnd('', 'value');
              });
              it('inserts the element into the end', function () {
                expect(element.at(0)?.currentKey).to.equal(0);
                expect(element.at(0)?.value).to.equal('');
                expect(element.at(1)?.currentKey).to.equal(1);
                expect(element.at(1)?.value).to.equal('value');
              });
            });
          });
          context('with keys and placeholders', function () {
            const doc = new Document({});
            const element = new Element('emails', ['first val'], doc);
            before(function () {
              element.insertPlaceholder();
              element.insertPlaceholder();
              element.insertEnd('', 'value');
            });
            it('inserts the element into the end', function () {
              expect(element.at(0)?.currentKey).to.equal(0);
              expect(element.at(0)?.value).to.equal('first val');
              expect(element.at(1)?.currentKey).to.equal(1);
              expect(element.at(1)?.value).to.equal('');
              expect(element.at(2)?.currentKey).to.equal(2);
              expect(element.at(2)?.value).to.equal('');
              expect(element.at(3)?.currentKey).to.equal(3);
              expect(element.at(3)?.value).to.equal('value');
            });
          });
        });
      });
    });

    describe('#insertSiblingPlaceholder', function () {
      context('into an empty array', function () {
        const doc = new Document({});
        const element = new Element('emails', [], doc);
        before(function () {
          element.insertPlaceholder();
          element.at(0)?.insertSiblingPlaceholder();
        });
        it('array has two empty string element', function () {
          expect(element.at(0)?.currentKey).to.equal(0);
          expect(element.at(0)?.value).to.equal('');
          expect(element.at(1)?.currentKey).to.equal(1);
          expect(element.at(1)?.value).to.equal('');
          expect(element.elements?.size).to.equal(2);
        });
        it('element is modified', function () {
          expect(element.at(0)?.isModified()).to.equal(true);
          expect(element.at(1)?.isModified()).to.equal(true);
        });
      });
      context('into a full array', function () {
        const doc = new Document({});
        const element = new Element('emails', ['item0', 'item1', 'item2'], doc);
        before(function () {
          element.at(2)?.insertSiblingPlaceholder();
        });
        it('inserts the element into the end', function () {
          expect(element.at(3)?.currentKey).to.equal(3);
          expect(element.at(3)?.value).to.equal('');
        });
        it('keeps the other elements the same', function () {
          expect(element.elements?.size).to.equal(4);
          for (let i = 0; i < 3; i++) {
            expect(element.at(i)?.currentKey).to.equal(i);
            expect(element.at(i)?.value).to.equal(`item${i}`);
          }
        });
        it('element is modified', function () {
          for (let i = 0; i < 4; i++) {
            expect(element.at(i)?.isModified()).to.equal(i === 3);
          }
        });
      });
      context('into a number array', function () {
        const doc = new Document({});
        const element = new Element('emails', [25, 123], doc);
        before(function () {
          element.at(1)?.insertSiblingPlaceholder();
        });
        it('inserts a number type element into the end', function () {
          expect(element.at(2)?.value).to.deep.equal(new Int32(0));
        });
      });
      context('into a date array', function () {
        const doc = new Document({});
        const element = new Element('emails', [new Date(), new Date()], doc);
        before(function () {
          element.at(1)?.insertSiblingPlaceholder();
        });
        it('inserts a date type element into the end', function () {
          expect(element.at(2)?.value).to.deep.equal(new Date(0));
        });
      });
      context('into an array of arrays', function () {
        const doc = new Document({});
        const element = new Element(
          'emails',
          [
            [1, 2],
            [3, 4],
          ],
          doc
        );
        before(function () {
          element.at(1)?.insertSiblingPlaceholder();
        });
        it('inserts an array type element into the end', function () {
          expect(element.elements?.size).to.equal(3);
          expect(element.elements?.at(1)?.elements?.at(0)?.value).to.deep.equal(
            new Int32(3)
          );
          expect(element.elements?.at(2)?.currentType).to.equal('Array');
          expect(element.elements?.at(2)?.elements?.size).to.equal(0);
          expect(element.elements?.at(2)?.generateObject()).to.deep.equal([]);
        });
        context('into an array of objects', function () {
          const doc = new Document({});
          const element = new Element(
            'fruits',
            [
              {
                name: 'pineapple',
              },
              {
                name: 'orange',
              },
            ],
            doc
          );
          before(function () {
            element.at(1)?.insertSiblingPlaceholder();
          });
          it('inserts an object type element into the end', function () {
            expect(element.elements?.size).to.equal(3);
            expect(
              element.elements?.at(1)?.elements?.get('name')?.value
            ).to.equal('orange');
            expect(element.elements?.at(2)?.currentType).to.equal('Object');
            expect(element.elements?.at(2)?.elements?.size).to.equal(0);
            expect(element.generateObject()).to.deep.equal([
              {
                name: 'pineapple',
              },
              {
                name: 'orange',
              },
              {},
            ]);
          });
        });
      });
    });

    describe('#remove', function () {
      context('element to be removed is top-level', function () {
        context('and is added', function () {
          const doc = new Document({});
          const items = ['item0', 'item2'];
          const element = new Element('items', items, doc);

          before(function () {
            element.insertAfter(element.at(0)!, 'key3', 'item1');
            expect(element.generateObject()).to.deep.equal([
              'item0',
              'item1',
              'item2',
            ]);
            expect(element.generateOriginalObject()).to.deep.equal(items);
            element.at(1)?.remove();
          });
          it('deletes the element', function () {
            expect(element.generateObject()).to.deep.equal(items);
            expect(element.isModified()).to.equal(false);
          });
          it('updates keys correctly', function () {
            expect(element.at(0)?.currentKey).to.equal(0);
            expect(element.at(0)?.key).to.equal(0);
            expect(element.at(0)?.value).to.equal('item0');
            expect(element.at(1)?.currentKey).to.equal(1);
            expect(element.at(1)?.key).to.equal(1);
            expect(element.at(1)?.value).to.equal('item2');
          });
        });
        context('and is not added', function () {
          const doc = new Document({});
          const items = ['item0', 'item2'];
          const element = new Element(
            'items',
            ['item0', 'item1', 'item2'],
            doc
          );

          before(function () {
            element.at(1)?.remove();
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
            expect(element.at(0)?.currentKey).to.equal(0);
            expect(element.at(0)?.value).to.equal('item0');
            expect(element.at(1)?.currentKey).to.equal(1);
            expect(element.at(1)?.key).to.equal(1);
            expect(element.at(1)?.value).to.equal('item1');
            expect(element.at(1)?.isRemoved()).to.equal(true);
            expect(element.at(2)?.key).to.equal(2);
            expect(element.at(2)?.value).to.equal('item2');
            expect(element.at(2)?.isEdited()).to.equal(false);
            expect(element.at(2)?.isRenamed()).to.equal(false);
          });
          it('sets flags correctly', function () {
            expect(element.at(0)?.isModified()).to.equal(false);
            expect(element.at(1)?.isRemoved()).to.equal(true);
            expect(element.at(2)?.isModified()).to.equal(false);
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
          const element = new Element('items', items, doc);
          before(function () {
            element.at(0)?.insertAfter(element.at(0)!.at(1)!, '$new', '99');
            expect(element.generateObject()).to.deep.equal([
              ['00', '01', '99', '02'],
              ['10', '11', '12'],
            ]);
            element.at(0)?.at(2)?.remove();
          });
          it('reverts the document', function () {
            expect(element.generateObject()).to.deep.equal(items);
            expect(element.isModified()).to.equal(false);
          });
          it('updates keys correctly', function () {
            for (let i = 0; i < items.length; i++) {
              for (let j = 0; j < items[0].length; j++) {
                const parent = element.at(i);
                expect(parent?.currentKey).to.equal(i);
                expect(parent?.key).to.equal(i);
                expect(parent?.at(j)?.currentKey).to.equal(j);
                expect(parent?.at(j)?.key).to.equal(j);
                expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
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
          const element = new Element('items', items, doc);
          before(function () {
            element.at(0)?.at(2)?.remove();
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
            expect(element.at(0)?.currentKey).to.equal(0);
            expect(element.at(0)?.key).to.equal(0);
            expect(element.at(0)?.isModified()).to.equal(true);
            expect(element.at(1)?.currentKey).to.equal(1);
            expect(element.at(1)?.key).to.equal(1);
            expect(element.at(1)?.isModified()).to.equal(false);
          });
          it('updates keys correctly', function () {
            const parent = element.at(0);
            expect(parent?.at(0)?.currentKey).to.equal(0);
            expect(parent?.at(0)?.value).to.equal('00');
            expect(parent?.at(1)?.currentKey).to.equal(1);
            expect(parent?.at(1)?.value).to.equal('01');
            expect(parent?.at(2)?.currentKey).to.equal(2);
            expect(parent?.at(2)?.value).to.equal('99');
            expect(parent?.at(2)?.isRemoved()).to.equal(true);
            expect(parent?.at(3)?.currentKey).to.equal(3);
            expect(parent?.at(3)?.value).to.equal('02');
          });
          it('updates flags correctly', function () {
            const parent = element.at(0);
            expect(parent?.at(0)?.isModified()).to.equal(false);
            expect(parent?.at(1)?.isModified()).to.equal(false);
            expect(parent?.at(2)?.isRemoved()).to.equal(true);
            expect(parent?.at(3)?.isModified()).to.equal(false);
          });
        });
      });
    });

    describe('#revert', function () {
      context('element to be reverted is top-level', function () {
        context('and is added', function () {
          const doc = new Document({});
          const items = ['item0', 'item1', 'item2'];
          const element = new Element('items', items, doc);

          before(function () {
            element.insertAfter(element.at(0)!, '', 'item9');
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
              expect(element.at(i)?.currentKey).to.equal(i);
              expect(element.at(i)?.key).to.equal(i);
              expect(element.at(i)?.value).to.equal(`item${i}`);
            }
          });
        });
        context('and is removed', function () {
          const doc = new Document({});
          const items = ['item0', 'item1', 'item2', 'item3'];
          const element = new Element('items', items, doc);

          before(function () {
            element.at(1)?.remove();
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
              expect(element.at(i)?.currentKey).to.equal(i);
              expect(element.at(i)?.key).to.equal(i);
              expect(element.at(i)?.value).to.equal(`item${i}`);
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
            const element = new Element('items', items, doc);
            before(function () {
              element.at(0)?.insertAfter(element.at(0)!.at(1)!, '$new', '99');
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
                  expect(parent?.currentKey).to.equal(i);
                  expect(parent?.key).to.equal(i);
                  expect(parent?.at(j)?.currentKey).to.equal(j);
                  expect(parent?.at(j)?.key).to.equal(j);
                  expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
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
            const element = new Element('items', items, doc);
            before(function () {
              element.at(0)?.at(1)?.remove();
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
                  expect(parent?.currentKey).to.equal(i);
                  expect(parent?.key).to.equal(i);
                  expect(parent?.at(j)?.currentKey).to.equal(j);
                  expect(parent?.at(j)?.key).to.equal(j);
                  expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
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
            const element = new Element('items', items, doc);
            before(function () {
              element.at(0)?.insertAfter(element.at(0)!.at(1)!, '$new', '99');
              expect(element.generateObject()).to.deep.equal([
                ['00', '01', '99', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0)?.revert();
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
                  expect(parent?.currentKey).to.equal(i);
                  expect(parent?.key).to.equal(i);
                  expect(parent?.at(j)?.currentKey).to.equal(j);
                  expect(parent?.at(j)?.key).to.equal(j);
                  expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
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
            const element = new Element('items', items, doc);
            before(function () {
              element.at(0)?.at(1)?.remove();
              expect(element.generateObject()).to.deep.equal([
                ['00', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0)?.revert();
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
                  expect(parent?.currentKey).to.equal(i);
                  expect(parent?.key).to.equal(i);
                  expect(parent?.at(j)?.currentKey).to.equal(j);
                  expect(parent?.at(j)?.key).to.equal(j);
                  expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
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
            const element = new Element('items', items, doc);
            before(function () {
              element.at(0)?.insertAfter(element.at(0)!.at(1)!, '$new', '99');
              expect(element.generateObject()).to.deep.equal([
                ['00', '01', '99', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0)?.at(2)?.revert();
            });
            it('reverts the document', function () {
              expect(element.generateObject()).to.deep.equal(items);
              expect(element.isModified()).to.equal(false);
            });
            it('updates keys correctly', function () {
              for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items[0].length; j++) {
                  const parent = element.at(i);
                  expect(parent?.currentKey).to.equal(i);
                  expect(parent?.key).to.equal(i);
                  expect(parent?.at(j)?.currentKey).to.equal(j);
                  expect(parent?.at(j)?.key).to.equal(j);
                  expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
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
            const element = new Element('items', items, doc);
            before(function () {
              element.at(0)?.at(1)?.remove();
              expect(element.generateObject()).to.deep.equal([
                ['00', '02'],
                ['10', '11', '12'],
              ]);
              element.at(0)?.at(1)?.revert();
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
                  expect(parent?.currentKey).to.equal(i);
                  expect(parent?.key).to.equal(i);
                  expect(parent?.at(j)?.currentKey).to.equal(j);
                  expect(parent?.at(j)?.key).to.equal(j);
                  expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
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
      const element = new Element('items', items, doc);
      before(function () {
        element.at(1)?.at(0)?.remove();
        element.at(0)?.insertAfter(element.at(0)!.at(0)!, '$new', '99');
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
            expect(parent?.currentKey).to.equal(i);
            expect(parent?.key).to.equal(i);
            expect(parent?.at(j)?.currentKey).to.equal(j);
            expect(parent?.at(j)?.key).to.equal(j);
            expect(parent?.at(j)?.value).to.equal(`${i}${j}`);
          }
        }
      });
    });
  });

  context('when attempting to expand a non-expandable element', function () {
    it('should do nothing', function () {
      const element = new Element('name', 'A');

      const expandListener = Sinon.fake();
      element.on(ElementEvents.Expanded, expandListener);
      element.expand();
      expect(expandListener).to.not.be.called;
    });
  });

  context('when expanding just the element itself', function () {
    it('should only expand the target element', function () {
      const element = new Element('names', {
        firstName: 'A',
        addresses: [1, 2],
      });
      expect(element.expanded).to.be.false;

      element.expand();
      expect(element.expanded).to.be.true;
      expect(element.elements?.every((el) => el.expanded)).to.false;
    });

    it('should emit an expanded event on the target element itself', function () {
      const element = new Element('names', { firstName: 'A', lastName: 'B' });
      const emitSpy = Sinon.spy(element, 'emit');
      element.expand();
      expect(emitSpy).to.be.calledWithExactly(ElementEvents.Expanded, element);
    });
  });

  context('when expanding the element along with its children', function () {
    it('should expand the target element and its children', function () {
      const element = new Element('names', {
        firstName: 'A',
        addresses: [1, 2],
      });
      expect(element.expanded).to.be.false;

      element.expand(true);
      expect(element.expanded).to.be.true;

      for (const el of element.elements ?? []) {
        if (isValueExpandable(el.originalExpandableValue)) {
          expect(el.expanded).to.be.true;
        }
      }
    });
  });

  describe('#getVisibleElements', function () {
    context('when element is not expandable', function () {
      it('should return an empty list', function () {
        expect(new Element('name', 'A').getVisibleElements()).to.have.lengthOf(
          0
        );
        expect(new Element('count', 1).getVisibleElements()).to.have.lengthOf(
          0
        );
        expect(
          new Element('_id', new ObjectId()).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('_id', new Binary()).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new Code('')).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new MaxKey()).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new MinKey()).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new Timestamp({ t: 1, i: 1 })).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new Int32(32)).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new Long(32)).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new Double(0.2)).getVisibleElements()
        ).to.have.lengthOf(0);
        expect(
          new Element('x', new Decimal128('0.2')).getVisibleElements()
        ).to.have.lengthOf(0);
      });
    });

    context('when element is expandable', function () {
      it("should return total nested elements if nested elements are less than element's visible element count", function () {
        const listElement = new Element('list', [1, 2, 3]);
        expect(listElement.getVisibleElements()).to.have.lengthOf(0); // because it is not expanded
        listElement.expand();
        expect(listElement.getVisibleElements()).to.have.lengthOf(3);

        const obElement = new Element('ob', { prop1: '1', prop2: '2' });
        expect(obElement.getVisibleElements()).to.have.lengthOf(0); // because it is not expanded
        obElement.expand();
        expect(obElement.getVisibleElements()).to.have.lengthOf(2);
      });

      it("should return sliced list of nested elements if nested elements are more than element's visible element count", function () {
        const listElement = new Element('list', [1, 2, 3]);
        listElement.expand();
        listElement.setMaxVisibleElementsCount(1);
        const listVisibleElements = listElement.getVisibleElements();
        expect(listVisibleElements).to.have.lengthOf(1);
        expect(
          listVisibleElements.map((element) => element.value)
        ).to.deep.equal([{ value: 1 }]);
        listElement.setMaxVisibleElementsCount(25);
        expect(listElement.getVisibleElements()).to.have.lengthOf(3);

        const obElement = new Element('ob', {
          prop1: '1',
          prop2: '2',
          prop3: '3',
        });
        obElement.expand();
        obElement.setMaxVisibleElementsCount(1);
        const obVisibleElement = obElement.getVisibleElements();
        expect(obVisibleElement).to.have.lengthOf(1);
        expect(obVisibleElement.map((element) => element.value)).to.deep.equal([
          '1',
        ]);
        obElement.setMaxVisibleElementsCount(25);
        expect(obElement.getVisibleElements()).to.have.lengthOf(3);
      });
    });
  });

  describe('#setVisibleElementsCount', function () {
    context('when element is not expandable', function () {
      it('should not do anything', function () {
        const element = new Element('name', 'string');
        const spy = Sinon.spy();
        element.on(ElementEvents.VisibleElementsChanged, spy);
        element.setMaxVisibleElementsCount(10);
        expect(element.maxVisibleElementsCount).to.equal(
          DEFAULT_VISIBLE_ELEMENTS
        );
        expect(spy).to.not.be.called;
      });
    });

    context('when element is expandable', function () {
      it('should update the visible count and bubble up the event', function () {
        const spy = Sinon.spy();
        const rootElement = new Element('nestedOb', {
          address: {
            zip: '111111',
          },
        });
        const [addressElement] = [...(rootElement.elements as ElementList)];
        rootElement.on(ElementEvents.VisibleElementsChanged, spy);
        addressElement.setMaxVisibleElementsCount(10);
        expect(addressElement.maxVisibleElementsCount).to.equal(10);
        expect(spy).to.not.be.called; // not called because the element was not expanded and hence no visible changes

        rootElement.expand(true);
        addressElement.setMaxVisibleElementsCount(11);
        expect(addressElement.maxVisibleElementsCount).to.equal(11);
        expect(spy).to.be.calledWithExactly(addressElement, rootElement);
      });
    });
  });

  describe('#getTotalVisibleElementsCount', function () {
    context('if the element is not expandable', function () {
      it('should return 0', function () {
        expect(
          new Element('name', 'A').getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(new Element('count', 1).getTotalVisibleElementsCount()).to.equal(
          0
        );
        expect(
          new Element('_id', new ObjectId()).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('_id', new Binary()).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('x', new Code('')).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('x', new MaxKey()).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('x', new MinKey()).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element(
            'x',
            new Timestamp({ t: 1, i: 1 })
          ).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('x', new Int32(32)).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('x', new Long(32)).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('x', new Double(0.2)).getTotalVisibleElementsCount()
        ).to.equal(0);
        expect(
          new Element('x', new Decimal128('0.2')).getTotalVisibleElementsCount()
        ).to.equal(0);
      });
    });
    context('if element is expandable', function () {
      it('should still return 0 if the item is not expanded', function () {
        const nestedObElement = new Element('nestedOb', {
          prop1: {
            prop2: {
              prop3: {
                prop4: {
                  prop5: 'Yup',
                },
              },
            },
          },
        });
        expect(nestedObElement.getTotalVisibleElementsCount()).to.equal(0);
      });
      it('should do a recursive tree traversal for providing the total visible elements count', function () {
        const nestedObElement = new Element('nestedOb', {
          prop1: {
            prop2: {
              prop3: {
                prop4: {
                  prop5: 'Yup',
                },
              },
            },
          },
        });
        // we need to expand the element all the way to its children to make it
        // visible
        nestedObElement.expand(true);
        expect(nestedObElement.getTotalVisibleElementsCount()).to.equal(5);
      });
      context(
        'and total child elements are less than the allowed visible elements',
        function () {
          it('should return the count for number of child elements', function () {
            const nestedObElement = new Element('nestedOb', {
              prop1: 'x',
              prop2: 'y',
            });
            nestedObElement.expand();
            expect(nestedObElement.getTotalVisibleElementsCount()).to.equal(2);
          });
        }
      );
      context(
        'and total child elements are more than the allowed visible elements',
        function () {
          it('should return the count for allowed visible elements', function () {
            const nestedObElement = new Element('nestedOb', {
              prop1: 'x',
              prop2: 'y',
            });
            nestedObElement.expand();
            nestedObElement.setMaxVisibleElementsCount(1);
            expect(nestedObElement.getTotalVisibleElementsCount()).to.equal(1);
          });
        }
      );
    });
  });

  context(
    'when expanding an element that has been added with a changed type',
    function () {
      it('should expand the target element and its children', function () {
        const element = new Element('names', {
          firstName: 'A',
          addresses: [1, 2],
        });
        expect(element.expanded).to.be.false;

        element.insertEnd('pineapple', 'to be changed');
        element.get('pineapple')?.changeType('Object');

        element.insertEnd('pie', new Int32(123));
        element.get('pie')?.changeType('Array');

        expect(element.get('pineapple')?.expanded).to.be.false;
        expect(element.get('pie')?.expanded).to.be.false;

        element.expand(true);
        expect(element.expanded).to.be.true;
        expect(element.get('pineapple')?.expanded).to.be.true;
        expect(element.get('pie')?.expanded).to.be.true;
      });
    }
  );

  describe('#toEJSON', function () {
    it('handles null values', function () {
      const element = new Element('test', {
        a: 1,
        b: { foo: 2 },
        null_val: null,
      });
      expect(element.toEJSON('current', { indent: undefined })).to.equal(
        '{"a":1,"b":{"foo":2},"null_val":null}'
      );
    });

    it('serializes Int32/Double as relaxed but not Int64', function () {
      const element = new Element('test', {
        a: 1,
        b: 1.5,
        c: Long.fromNumber(2),
      });
      expect(element.toEJSON('current', { indent: undefined })).to.equal(
        '{"a":1,"b":1.5,"c":{"$numberLong":"2"}}'
      );
    });

    it('serializes Date as relaxed, but not dates before 1970 and after 9999', function () {
      const element = new Element('test', {
        epoch: new Date(0),
        negative: new Date(-1),
        y10k: new Date(253402300800000),
      });
      expect(element.toEJSON('current', { indent: undefined })).to.equal(
        '{"epoch":{"$date":"1970-01-01T00:00:00.000Z"},"negative":{"$date":{"$numberLong":"-1"}},"y10k":{"$date":{"$numberLong":"253402300800000"}}}'
      );
    });

    it('optionally serializes the current or the original element', function () {
      const element = new Element('test', {
        a: 1,
        b: 1.5,
        c: Long.fromNumber(2),
      });
      element.get('a')?.edit(new Int32(2));
      expect(element.toEJSON('current', { indent: undefined })).to.equal(
        '{"a":2,"b":1.5,"c":{"$numberLong":"2"}}'
      );
      expect(element.toEJSON('original', { indent: undefined })).to.equal(
        '{"a":1,"b":1.5,"c":{"$numberLong":"2"}}'
      );
    });

    it('allows specifying JSON indent', function () {
      const element = new Element('test', { a: 1 });
      expect(element.toEJSON('current', { indent: '>' })).to.equal(
        '{\n>"a": 1\n}'
      );
    });

    it('handles oddball floating point values', function () {
      const element = new Element('test', {
        negzero: new Double(-0),
        int: new Int32(1),
        inf: Infinity,
        ninf: -Infinity,
        nan: NaN,
      });
      expect(element.toEJSON('current', { indent: undefined })).to.equal(
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
