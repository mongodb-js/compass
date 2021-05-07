import { Element } from 'hadron-document';
import { ObjectID as ObjectId } from 'bson';
import { ObjectIdEditor } from 'components/editor';

describe('ObjectIdEditor', () => {
  describe('#start', () => {
    const objectIdString = '598398b16a636b7637f475c0';
    const objectId = new ObjectId(objectIdString);
    const element = new Element('objectId', objectId, false);

    context('when the current type is valid (not yet edited)', () => {
      const objectIdEditor = new ObjectIdEditor(element);

      before(() => {
        objectIdEditor.start();
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(objectIdString);
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current type is not valid (edited, blurred, and edited again)', () => {
      const objectIdEditor = new ObjectIdEditor(element);

      before(() => {
        objectIdEditor.start();
        objectIdEditor.edit('not valid');
        objectIdEditor.complete();
        objectIdEditor.start();
      });

      it('edits the element with the raw value', () => {
        expect(element.currentValue).to.equal('not valid');
      });

      it('sets the current value as invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.include('String of 12 bytes');
      });
    });
  });

  describe('#edit', () => {
    const objectIdString = '598398b16a636b7637f475c0';
    const objectId = new ObjectId(objectIdString);
    const element = new Element('objectId', objectId, false);

    context('when the objectId string is valid', () => {
      const objectIdEditor = new ObjectIdEditor(element);
      const newValidString = '598398b16a636b7637f475c1';

      before(() => {
        objectIdEditor.start();
        objectIdEditor.edit(newValidString);
      });

      it('keeps the string as the current value', () => {
        expect(element.currentValue).to.equal(newValidString);
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the objectId string is invalid', () => {
      const objectIdEditor = new ObjectIdEditor(element);
      const invalidString = 'nope';

      before(() => {
        objectIdEditor.start();
        objectIdEditor.edit(invalidString);
      });

      it('keeps the string as the current value', () => {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.include('String of 12 bytes');
      });
    });
  });

  describe('#complete', () => {
    const objectIdString = '598398b16a636b7637f475c0';
    const objectId = new ObjectId(objectIdString);
    const element = new Element('objectId', objectId, false);

    context('when the objectId string is valid', () => {
      const objectIdEditor = new ObjectIdEditor(element);
      const newValidString = '598398b16a636b7637f475c1';

      before(() => {
        objectIdEditor.start();
        objectIdEditor.edit(newValidString);
        objectIdEditor.complete();
      });

      it('casts the current value to the real type', () => {
        expect(element.currentValue).to.deep.equal(new ObjectId(newValidString));
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the objectId string is invalid', () => {
      const objectIdEditor = new ObjectIdEditor(element);
      const invalidString = 'nope';

      before(() => {
        objectIdEditor.start();
        objectIdEditor.edit(invalidString);
        objectIdEditor.complete();
      });

      it('keeps the string as the current value', () => {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.include('String of 12 bytes');
      });
    });
  });

  describe('#size', () => {
    context('when the objectId is valid', () => {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      it('returns the number of chars in the hex string', () => {
        expect(objectIdEditor.size()).to.equal(24);
      });
    });

    context('when the objectId is not valid', () => {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      before(() => {
        objectIdEditor.edit('testing');
      });

      it('returns the number of chars in the raw string', () => {
        expect(objectIdEditor.size()).to.equal(7);
      });
    });
  });

  describe('#value', () => {
    context('when the objectId is valid', () => {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      it('returns the value', () => {
        expect(objectIdEditor.value()).to.equal(objectId);
      });
    });

    context('when the objectId is not valid', () => {
      const objectIdString = '598398b16a636b7637f475c0';
      const objectId = new ObjectId(objectIdString);
      const element = new Element('objectId', objectId, false);
      const objectIdEditor = new ObjectIdEditor(element);

      before(() => {
        objectIdEditor.edit('testing');
      });

      it('returns the raw string', () => {
        expect(objectIdEditor.value()).to.equal('testing');
      });
    });
  });
});
