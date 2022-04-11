import { Double } from 'bson';
import { Element } from '../..';
import { DoubleEditor } from '../../src/editor';
import { expect } from 'chai';

describe('DoubleEditor', function () {
  describe('#start', function () {
    const doubleValue = new Double(12.2);
    const element = new Element('field', doubleValue, false);

    context('when the current type is not edited and is valid', function () {
      const doubleEditor = new DoubleEditor(element);

      before(function () {
        doubleEditor.start();
      });

      it('returns the number of characters', function () {
        expect(doubleEditor.size()).to.equal(4);
      });

      it('edits the element with the formatted value', function () {
        expect(element.currentValue).to.equal(doubleValue);
      });

      it('sets the current value as a valid value', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current type is not valid', function () {
      const doubleEditor = new DoubleEditor(element);

      before(function () {
        doubleEditor.start();
        doubleEditor.edit('cats cats not valid cats');
        doubleEditor.complete();
        doubleEditor.start();
      });

      it('returns the number of characters', function () {
        expect(doubleEditor.size()).to.equal(24);
      });

      it('edits the element with the formatted value', function () {
        expect(element.currentValue).to.equal('cats cats not valid cats');
      });

      it('sets the invalid message', function () {
        expect(element.invalidTypeMessage).to.equal(
          'cats cats not valid cats is not a valid double format'
        );
      });
    });
  });

  describe('#edit', function () {
    const doubleValue = new Double(12.2);
    const element = new Element('field', doubleValue, false);

    context('when the current value is edited to a valid double', function () {
      const doubleEditor = new DoubleEditor(element);
      const validDouble = new Double(156.9);

      before(function () {
        doubleEditor.start();
        doubleEditor.edit(validDouble);
      });

      it('returns the number of characters', function () {
        expect(doubleEditor.size()).to.equal(5);
      });

      it('edits the element with the formatted value', function () {
        expect(element.currentValue).to.equal(validDouble);
      });

      it('sets the current value as a valid value', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context(
      'when the current value is edited to an invalid double',
      function () {
        const doubleEditor = new DoubleEditor(element);
        const invalidDouble = "ceci n'est pas un double";

        before(function () {
          doubleEditor.start();
          doubleEditor.edit(invalidDouble);
        });

        it('returns the number of characters', function () {
          expect(doubleEditor.size()).to.equal(24);
        });

        it('edits the element with the formatted value', function () {
          expect(element.currentValue).to.equal(invalidDouble);
        });

        it('curent type is invalid', function () {
          expect(element.isCurrentTypeValid()).to.equal(false);
        });

        it('sets the invalid message', function () {
          expect(element.invalidTypeMessage).to.match(
            /is not a valid double format/
          );
        });
      }
    );
  });

  describe('#complete', function () {
    const doubleValue = new Double(12.2);
    const element = new Element('field', doubleValue, false);

    context('when the current value is edited to a valid double', function () {
      const doubleEditor = new DoubleEditor(element);
      const valid = new Double(15.9);

      before(function () {
        doubleEditor.start();
        doubleEditor.edit(valid);
        doubleEditor.complete();
      });

      it('returns the number of characters', function () {
        expect(doubleEditor.size()).to.equal(4);
      });

      it('edits the element with the formatted value', function () {
        expect(element.currentValue).to.deep.equal(new Double(15.9));
      });

      it('sets the current value as a valid value', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context(
      'when the current value is edited to an invalid double',
      function () {
        const doubleEditor = new DoubleEditor(element);
        const invalidDouble = "ceci n'est pas un double";

        before(function () {
          doubleEditor.start();
          doubleEditor.edit(invalidDouble);
          doubleEditor.complete();
        });

        it('returns the number of characters', function () {
          expect(doubleEditor.size()).to.equal(24);
        });

        it('edits the element with the formatted value', function () {
          expect(element.currentValue).to.equal(invalidDouble);
        });

        it('curent type is invalid', function () {
          expect(element.isCurrentTypeValid()).to.equal(false);
        });

        it('sets the invalid message', function () {
          expect(element.invalidTypeMessage).to.match(
            /is not a valid double format/
          );
        });
      }
    );
  });
});
