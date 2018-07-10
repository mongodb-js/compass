import { Element } from 'hadron-document';
import { Double } from 'bson';
import { DoubleEditor } from 'components/editor';

describe('DoubleEditor', () => {
  describe('#start', () => {
    const doubleValue = new Double(12.2);
    const element = new Element('field', doubleValue, false);

    context('when the current type is not edited and is valid', () => {
      const doubleEditor = new DoubleEditor(element);

      before(() => {
        doubleEditor.start();
      });

      it('returns the number of characters', () => {
        expect(doubleEditor.size()).to.equal(4);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(doubleValue);
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current type is not valid', () => {
      const doubleEditor = new DoubleEditor(element);

      before(() => {
        doubleEditor.start();
        doubleEditor.edit('cats cats not valid cats');
        doubleEditor.complete();
        doubleEditor.start();
      });

      it('returns the number of characters', () => {
        expect(doubleEditor.size()).to.equal(9);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal('cats cats not valid cats');
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('cats cats not valid cats is not a valid double format');
      });
    });
  });

  describe('#edit', () => {
    const doubleValue = new Double(12.2);
    const element = new Element('field', doubleValue, false);

    context('when the current value is edited to a valid double', () => {
      const doubleEditor = new DoubleEditor(element);
      const validDouble = new Double(156.9);

      before(() => {
        doubleEditor.start();
        doubleEditor.edit(validDouble);
      });

      it('returns the number of characters', () => {
        expect(doubleEditor.size()).to.equal(5);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(validDouble);
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current value is edited to an invalid double', () => {
      const doubleEditor = new DoubleEditor(element);
      const invalidDouble = new Double('ceci n\'est pas un double');

      before(() => {
        doubleEditor.start();
        doubleEditor.edit(invalidDouble);
      });

      it('returns the number of characters', () => {
        expect(doubleEditor.size()).to.equal(24);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(invalidDouble);
      });

      it('curent type is invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('ceci n\'est pas un double is not a valid double format');
      });
    });
  });

  describe('#complete', () => {
    const doubleValue = new Double(12.2);
    const element = new Element('field', doubleValue, false);

    context('when the current value is edited to a valid double', () => {
      const doubleEditor = new DoubleEditor(element);
      const valid = new Double(15.9);

      before(() => {
        doubleEditor.start();
        doubleEditor.edit(valid);
        doubleEditor.complete();
      });

      it('returns the number of characters', () => {
        expect(doubleEditor.size()).to.equal(4);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.deep.equal(new Double(15.9));
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current value is edited to an invalid double', () => {
      const doubleEditor = new DoubleEditor(element);
      const invalidDouble = new Double('ceci n\'est pas un double');

      before(() => {
        doubleEditor.start();
        doubleEditor.edit(invalidDouble);
        doubleEditor.complete();
      });

      it('returns the number of characters', () => {
        expect(doubleEditor.size()).to.equal(24);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(invalidDouble);
      });

      it('curent type is invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('ceci n\'est pas un double is not a valid double format');
      });
    });
  });
});
