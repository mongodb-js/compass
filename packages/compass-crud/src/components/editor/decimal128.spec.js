import { Element } from 'hadron-document';
import { Decimal128 } from 'bson';
import { Decimal128Editor } from 'components/editor';

describe('Decimal128Editor', () => {
  describe('#start', () => {
    const decimal128Value = Decimal128.fromString('-7.50E+3');
    const element = new Element('field', decimal128Value, false);

    context('when the current type is not edited and is valid', () => {
      const decimal128Editor = new Decimal128Editor(element);

      before(() => {
        decimal128Editor.start();
      });

      it('returns the number of characters', () => {
        expect(decimal128Editor.size()).to.equal(8);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(decimal128Value);
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current type is not valid', () => {
      const decimal128Editor = new Decimal128Editor(element);

      before(() => {
        decimal128Editor.start();
        decimal128Editor.edit('cats cats not valid cats');
        decimal128Editor.complete();
        decimal128Editor.start();
      });

      it('returns the number of characters', () => {
        expect(decimal128Editor.size()).to.equal(24);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal('cats cats not valid cats');
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('cats cats not valid cats not a valid Decimal128 string');
      });
    });
  });

  describe('#edit', () => {
    const decimal128Value = Decimal128.fromString('12.2');
    const element = new Element('field', decimal128Value, false);

    context('when the current value is edited to a valid decimal128', () => {
      const decimal128Editor = new Decimal128Editor(element);
      const validDecimal128 = Decimal128.fromString('-1.23');

      before(() => {
        decimal128Editor.start();
        decimal128Editor.edit(validDecimal128);
      });

      it('returns the number of characters', () => {
        expect(decimal128Editor.size()).to.equal(5);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(validDecimal128);
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current value is edited to an invalid decimal128', () => {
      const decimal128Editor = new Decimal128Editor(element);

      before(() => {
        decimal128Editor.start();
        decimal128Editor.edit('ceci n\'est pas un decimal128');
      });

      it('returns the number of characters', () => {
        expect(decimal128Editor.size()).to.equal(28);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal('ceci n\'est pas un decimal128');
      });

      it('curent type is invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('ceci n\'est pas un decimal128 not a valid Decimal128 string');
      });
    });
  });

  describe('#complete', () => {
    const decimal128Value = Decimal128.fromString('-1.23');
    const element = new Element('field', decimal128Value, false);

    context('when the current value is edited to a valid decimal128', () => {
      const decimal128Editor = new Decimal128Editor(element);
      const valid = Decimal128.fromString('0.0');

      before(() => {
        decimal128Editor.start();
        decimal128Editor.edit(valid);
        decimal128Editor.complete();
      });

      it('returns the number of characters', () => {
        expect(decimal128Editor.size()).to.equal(3);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.deep.equal(Decimal128.fromString('0.0'));
      });

      it('sets the current value as a valid value', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current value is edited to an invalid decimal128', () => {
      const decimal128Editor = new Decimal128Editor(element);

      before(() => {
        decimal128Editor.start();
        decimal128Editor.edit('ceci n\'est pas un decimal128');
        decimal128Editor.complete();
      });

      it('returns the number of characters', () => {
        expect(decimal128Editor.size()).to.equal(28);
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal('ceci n\'est pas un decimal128');
      });

      it('curent type is invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('ceci n\'est pas un decimal128 not a valid Decimal128 string');
      });
    });
  });
});
