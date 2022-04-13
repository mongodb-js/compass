import { ObjectID as ObjectId } from 'bson';
import { Element } from '../../src';
import { ObjectIdEditor } from '../../src/editor';
import { expect } from 'chai';

describe('ObjectIdEditor', function () {
  describe('#start', function () {
    const objectIdString = '598398b16a636b7637f475c0';
    const objectId = new ObjectId(objectIdString);
    const element = new Element('objectId', objectId, false);

    context('when the current type is valid (not yet edited)', function () {
      const objectIdEditor = new ObjectIdEditor(element);

      before(function () {
        objectIdEditor.start();
      });

      it('edits the element with the formatted value', function () {
        expect(element.currentValue).to.equal(objectIdString);
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context(
      'when the current type is not valid (edited, blurred, and edited again)',
      function () {
        const objectIdEditor = new ObjectIdEditor(element);

        before(function () {
          objectIdEditor.start();
          objectIdEditor.edit('not valid');
          objectIdEditor.complete();
          objectIdEditor.start();
        });

        it('edits the element with the raw value', function () {
          expect(element.currentValue).to.equal('not valid');
        });

        it('sets the current value as invalid', function () {
          expect(element.isCurrentTypeValid()).to.equal(false);
        });

        it('sets the invalid message', function () {
          expect(element.invalidTypeMessage).to.include('String of 12 bytes');
        });
      }
    );
  });

  describe('#edit', function () {
    const objectIdString = '598398b16a636b7637f475c0';
    const objectId = new ObjectId(objectIdString);
    const element = new Element('objectId', objectId, false);

    context('when the objectId string is valid', function () {
      const objectIdEditor = new ObjectIdEditor(element);
      const newValidString = '598398b16a636b7637f475c1';

      before(function () {
        objectIdEditor.start();
        objectIdEditor.edit(newValidString);
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal(newValidString);
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the objectId string is invalid', function () {
      const objectIdEditor = new ObjectIdEditor(element);
      const invalidString = 'nope';

      before(function () {
        objectIdEditor.start();
        objectIdEditor.edit(invalidString);
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', function () {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', function () {
        expect(element.invalidTypeMessage).to.include('String of 12 bytes');
      });
    });
  });

  describe('#complete', function () {
    const objectIdString = '598398b16a636b7637f475c0';
    const objectId = new ObjectId(objectIdString);
    const element = new Element('objectId', objectId, false);

    context('when the objectId string is valid', function () {
      const objectIdEditor = new ObjectIdEditor(element);
      const newValidString = '598398b16a636b7637f475c1';

      before(function () {
        objectIdEditor.start();
        objectIdEditor.edit(newValidString);
        objectIdEditor.complete();
      });

      it('casts the current value to the real type', function () {
        expect(element.currentValue).to.deep.equal(
          new ObjectId(newValidString)
        );
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the objectId string is invalid', function () {
      const objectIdEditor = new ObjectIdEditor(element);
      const invalidString = 'nope';

      before(function () {
        objectIdEditor.start();
        objectIdEditor.edit(invalidString);
        objectIdEditor.complete();
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', function () {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', function () {
        expect(element.invalidTypeMessage).to.include('String of 12 bytes');
      });
    });
  });

  describe('#size', function () {
    context('when the objectId is valid', function () {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      it('returns the number of chars in the hex string', function () {
        expect(objectIdEditor.size()).to.equal(24);
      });
    });

    context('when the objectId is not valid', function () {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      before(function () {
        objectIdEditor.edit('testing');
      });

      it('returns the number of chars in the raw string', function () {
        expect(objectIdEditor.size()).to.equal(7);
      });
    });
  });

  describe('#value', function () {
    context('when the objectId is valid', function () {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      it('returns the value', function () {
        expect(objectIdEditor.value()).to.equal(objectIdString);
      });
    });

    context('when the objectId is not valid', function () {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      before(function () {
        objectIdEditor.edit('testing');
      });

      it('returns the raw string', function () {
        expect(objectIdEditor.value()).to.equal('testing');
      });
    });
  });
});
