const { Element } = require('../../lib');
const { Long } = require('bson');
const { Int64Editor } = require('../../lib/editor');
const { expect } = require('chai');

describe('Int64Editor', () => {
  describe('#start', () => {
    const int64Value = Long.fromString('750');
    const element = new Element('field', int64Value, false);

    context('when the current type is not edited and is valid', () => {
      const int64Editor = new Int64Editor(element);

      before(() => {
        int64Editor.start();
      });

      it('returns the number of characters', () => {
        expect(int64Editor.size()).to.equal(3);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(int64Value);
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current type is not valid', () => {
      const int64Editor = new Int64Editor(element);

      before(() => {
        int64Editor.start();
        int64Editor.edit('cats cats not valid cats');
        int64Editor.complete();
        int64Editor.start();
      });

      it('returns the number of characters', () => {
        expect(int64Editor.size()).to.equal(24);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal('cats cats not valid cats');
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('Value cats cats not valid cats is outside the valid Int64 range');
      });
    });
  });

  describe('#edit', () => {
    const int64Value = Long.fromString('122');
    const element = new Element('field', int64Value, false);

    context('when the current value is edited to a valid int64', () => {
      const int64Editor = new Int64Editor(element);
      const validInt64 = Long.fromString('123');

      before(() => {
        int64Editor.start();
        int64Editor.edit(validInt64);
      });

      it('returns the number of characters', () => {
        expect(int64Editor.size()).to.equal(3);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(validInt64);
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current value is edited to an invalid int64', () => {
      const int64Editor = new Int64Editor(element);

      before(() => {
        int64Editor.start();
        int64Editor.edit('ceci n\'est pas un int64');
      });

      it('returns the number of characters', () => {
        expect(int64Editor.size()).to.equal(23);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal('ceci n\'est pas un int64');
      });

      it('curent type is invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('Value ceci n\'est pas un int64 is outside the valid Int64 range');
      });
    });
  });

  describe('#complete', () => {
    const int64Value = Long.fromString('123');
    const element = new Element('field', int64Value, false);

    context('when the current value is edited to a valid int64', () => {
      const int64Editor = new Int64Editor(element);
      const valid = Long.fromString('0');

      before(() => {
        int64Editor.start();
        int64Editor.edit(valid);
        int64Editor.complete();
      });

      it('returns the number of characters', () => {
        expect(int64Editor.size()).to.equal(1);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.deep.equal(Long.fromString('0'));
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current value is edited to an large int64 that is out of range', () => {
      const int64Editor = new Int64Editor(element);

      before(() => {
        int64Editor.start();
        int64Editor.edit('10223372036854775810');
        int64Editor.complete();
      });

      it('returns the number of characters', () => {
        expect(int64Editor.size()).to.equal(20);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal('10223372036854775810');
      });

      it('curent type is invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('Value 10223372036854775810 is outside the valid Int64 range');
      });
    });
  });
});
