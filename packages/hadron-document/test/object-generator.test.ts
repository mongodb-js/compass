import { Binary } from 'bson';
import { expect } from 'chai';
import { Document } from '../src/';
import { ObjectGenerator } from '../src/object-generator';

describe('ObjectGenerator', function () {
  describe('#generate', function () {
    context('when an element is removed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0).remove();
      });

      it('does not include the element in the object', function () {
        expect(ObjectGenerator.generate(doc.elements)).to.deep.equal({});
      });
    });

    context('when an element is blank', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0).rename('');
      });

      it('does not include the element in the object', function () {
        expect(ObjectGenerator.generate(doc.elements)).to.deep.equal({});
      });
    });

    context('when the element is null', function () {
      it('returns null', function () {
        expect(ObjectGenerator.generate(null)).to.equal(null);
      });
    });

    context('when the element is undefined', function () {
      it('returns undefined', function () {
        expect(ObjectGenerator.generate(undefined)).to.equal(undefined);
      });
    });
  });

  describe('#generateOriginal', function () {
    context('when an element is removed', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0).remove();
      });

      it('includes the original element in the object', function () {
        expect(ObjectGenerator.generateOriginal(doc.elements)).to.deep.equal(
          object
        );
      });
    });

    context('when an element is blank', function () {
      const object = { name: 'test' };
      const doc = new Document(object);

      before(function () {
        doc.elements.at(0).rename('');
      });

      it('includes the original element in the object', function () {
        expect(ObjectGenerator.generateOriginal(doc.elements)).to.deep.equal(
          object
        );
      });
    });

    context('when the element is null', function () {
      it('returns null', function () {
        expect(ObjectGenerator.generateOriginal(null)).to.equal(null);
      });
    });

    context('when the element is undefined', function () {
      it('returns undefined', function () {
        expect(ObjectGenerator.generateOriginal(undefined)).to.equal(undefined);
      });
    });
  });

  describe('#generateArray', function () {
    const object = { names: ['a', 'b', 'c'] };
    const doc = new Document(object);

    context('when an element is removed', function () {
      before(function () {
        doc.elements.at(0).elements.at(1).remove();
      });

      it('does not include the element in the object', function () {
        expect(
          ObjectGenerator.generateArray(doc.elements.at(0).elements)
        ).to.deep.equal(['a', 'c']);
      });
    });

    context('when the element is null', function () {
      it('returns null', function () {
        expect(ObjectGenerator.generateArray(null)).to.equal(null);
      });
    });

    context('when the element is undefined', function () {
      it('returns undefined', function () {
        expect(ObjectGenerator.generateArray(undefined)).to.equal(undefined);
      });
    });
  });

  describe('#generateOriginalArray', function () {
    const object = { names: ['a', 'b', 'c'] };
    const doc = new Document(object);

    context('when an element is removed', function () {
      before(function () {
        doc.elements.at(0).elements.at(1).remove();
      });

      it('includes the original element in the object', function () {
        expect(
          ObjectGenerator.generateOriginalArray(doc.elements.at(0).elements)
        ).to.deep.equal(['a', 'b', 'c']);
      });
    });

    context('when the element is null', function () {
      it('returns null', function () {
        expect(ObjectGenerator.generateOriginalArray(null)).to.equal(null);
      });
    });

    context('when the element is undefined', function () {
      it('returns undefined', function () {
        expect(ObjectGenerator.generateOriginalArray(undefined)).to.equal(
          undefined
        );
      });
    });
  });

  context('with decrypted fields', function () {
    it('preserves encrypted fields', function () {
      const DECRYPTED_KEYS = Symbol.for('@@mdb.decryptedKeys');
      const object = {
        a: 1,
        b: {
          c: 2,
          d: Object.assign([3, 4], { [DECRYPTED_KEYS]: ['0'] }),
          [DECRYPTED_KEYS]: ['c'],
        },
        [DECRYPTED_KEYS]: ['a'],
      };
      const doc = new Document(object);

      // NB: Symbols are not covered by chai .to.deep.equal:
      const generated: any = doc.generateObject();
      expect(generated).to.deep.equal(object);
      expect(generated[DECRYPTED_KEYS]).to.deep.equal(object[DECRYPTED_KEYS]);
      expect(generated.b[DECRYPTED_KEYS]).to.deep.equal(
        object.b[DECRYPTED_KEYS]
      );
      expect(generated.b.d[DECRYPTED_KEYS]).to.deep.equal(
        object.b.d[DECRYPTED_KEYS]
      );

      const generatedOriginal: any = doc.generateOriginalObject();
      expect(generatedOriginal).to.deep.equal(object);
      expect(generatedOriginal[DECRYPTED_KEYS]).to.deep.equal(
        object[DECRYPTED_KEYS]
      );
      expect(generatedOriginal.b[DECRYPTED_KEYS]).to.deep.equal(
        object.b[DECRYPTED_KEYS]
      );
      expect(generatedOriginal.b.d[DECRYPTED_KEYS]).to.deep.equal(
        object.b.d[DECRYPTED_KEYS]
      );
    });
  });

  context('with __safeContent__ present', function () {
    const object = { foo: 'bar', __safeContent__: [new Binary('aaaa')] };
    const doc = new Document(object);

    it('optionally omits the internal field', function () {
      expect(doc.generateObject()).to.deep.equal(object);
      expect(doc.generateObject({ excludeInternalFields: true })).to.deep.equal(
        { foo: 'bar' }
      );
    });
  });
});
