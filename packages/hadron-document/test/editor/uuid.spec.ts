import { Binary } from 'bson';
import { Element } from '../../src';
import { UUIDEditor } from '../../src/editor';
import { expect } from 'chai';

describe('UUIDEditor', function () {
  const uuidString = '01234567-89ab-cdef-0123-456789abcdef';
  const uuidHex = '0123456789abcdef0123456789abcdef';

  describe('#value', function () {
    context('when the element is a UUID (subtype 4)', function () {
      const binary = Binary.createFromHexString(uuidHex, Binary.SUBTYPE_UUID);
      const element = new Element('uuid', binary, false);
      element.currentType = 'UUID';
      const uuidEditor = new UUIDEditor(element);

      it('returns the UUID string with hyphens', function () {
        expect(uuidEditor.value()).to.equal(uuidString);
      });
    });

    context('when the element is a LegacyPythonUUID (subtype 3)', function () {
      const binary = Binary.createFromHexString(
        uuidHex,
        Binary.SUBTYPE_UUID_OLD
      );
      const element = new Element('uuid', binary, false);
      element.currentType = 'LegacyPythonUUID';
      const uuidEditor = new UUIDEditor(element);

      it('returns the UUID string with hyphens (no byte reversal)', function () {
        expect(uuidEditor.value()).to.equal(uuidString);
      });
    });

    context('when the value is already a string', function () {
      const element = new Element('uuid', uuidString, false);
      element.currentType = 'UUID';
      const uuidEditor = new UUIDEditor(element);

      it('returns the string as-is', function () {
        expect(uuidEditor.value()).to.equal(uuidString);
      });
    });
  });

  describe('#edit', function () {
    context('when the UUID string is valid', function () {
      const binary = Binary.createFromHexString(uuidHex, Binary.SUBTYPE_UUID);
      const element = new Element('uuid', binary, false);
      element.currentType = 'UUID';
      const uuidEditor = new UUIDEditor(element);
      const newValidString = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      before(function () {
        uuidEditor.start();
        uuidEditor.edit(newValidString);
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal(newValidString);
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the UUID string is invalid', function () {
      const binary = Binary.createFromHexString(uuidHex, Binary.SUBTYPE_UUID);
      const element = new Element('uuid', binary, false);
      element.currentType = 'UUID';
      const uuidEditor = new UUIDEditor(element);
      const invalidString = 'not-a-valid-uuid';

      before(function () {
        uuidEditor.start();
        uuidEditor.edit(invalidString);
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal(invalidString);
      });

      it('sets the current value as invalid', function () {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', function () {
        expect(element.invalidTypeMessage).to.include('not a valid UUID');
      });
    });
  });

  describe('#complete', function () {
    context('when the UUID string is valid', function () {
      const binary = Binary.createFromHexString(uuidHex, Binary.SUBTYPE_UUID);
      const element = new Element('uuid', binary, false);
      element.currentType = 'UUID';
      const uuidEditor = new UUIDEditor(element);
      const newValidString = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      before(function () {
        uuidEditor.start();
        uuidEditor.edit(newValidString);
        uuidEditor.complete();
      });

      it('casts the current value to Binary', function () {
        expect(element.currentValue).to.be.instanceOf(Binary);
        expect((element.currentValue as Binary).sub_type).to.equal(
          Binary.SUBTYPE_UUID
        );
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the UUID string is invalid', function () {
      const binary = Binary.createFromHexString(uuidHex, Binary.SUBTYPE_UUID);
      const element = new Element('uuid', binary, false);
      element.currentType = 'UUID';
      const uuidEditor = new UUIDEditor(element);
      const invalidString = 'nope';

      before(function () {
        uuidEditor.start();
        uuidEditor.edit(invalidString);
        uuidEditor.complete();
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', function () {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });
    });
  });

  describe('#start', function () {
    context('when the current type is valid', function () {
      const binary = Binary.createFromHexString(uuidHex, Binary.SUBTYPE_UUID);
      const element = new Element('uuid', binary, false);
      element.currentType = 'UUID';
      const uuidEditor = new UUIDEditor(element);

      before(function () {
        uuidEditor.start();
      });

      it('converts the Binary to a UUID string for editing', function () {
        expect(element.currentValue).to.equal(uuidString);
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });
  });
});
