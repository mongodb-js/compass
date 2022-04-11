import { Element } from '../..';
import { StandardEditor } from '../../lib/editor';
import { expect } from 'chai';

describe('StandardEditor', function () {
  describe('#start', function () {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('has no behaviour', function () {
      expect(standardEditor.start()).to.equal(undefined);
    });
  });

  describe('#edit', function () {
    context('when the value is valid for the type', function () {
      const element = new Element('name', 'test', false);
      const standardEditor = new StandardEditor(element);

      before(function () {
        standardEditor.edit('testing');
      });

      it('edits the element with the value', function () {
        expect(element.currentValue).to.equal('testing');
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when editing boolean strings', function () {
      const bool = true;
      const element = new Element('boolean', bool, false);

      context('when the boolean string is valid', function () {
        const standardEditor = new StandardEditor(element);

        before(function () {
          standardEditor.start();
          standardEditor.edit('false');
        });

        it('keeps the string as the current value', function () {
          expect(element.currentValue).to.equal(false);
        });

        it('sets the current value as valid', function () {
          expect(element.isCurrentTypeValid()).to.equal(true);
        });
      });

      context('when the standard string is invalid', function () {
        const standardEditor = new StandardEditor(element);
        const invalidString = 'fal';

        before(function () {
          standardEditor.start();
          standardEditor.edit(invalidString);
        });

        it('keeps the string as the current value', function () {
          expect(element.currentValue).to.equal('fal');
        });

        it('sets the current value as invalid', function () {
          expect(element.isCurrentTypeValid()).to.equal(false);
        });

        it('sets the invalid message', function () {
          expect(element.invalidTypeMessage).to.equal(
            "'fal' is not a valid boolean string"
          );
        });
      });
    });
  });

  describe('#paste', function () {
    context('when the string is an object', function () {
      const element = new Element('name', {}, false);
      const standardEditor = new StandardEditor(element);

      before(function () {
        standardEditor.paste('{"name": "test"}');
      });

      it('converts the element to an object', function () {
        expect(element.elements.at(0).currentKey).to.equal('name');
        expect(element.elements.at(0).currentValue).to.equal('test');
      });

      it('sets the current type as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the string is not an array or object', function () {
      const element = new Element('name', 'test', false);
      const standardEditor = new StandardEditor(element);

      before(function () {
        standardEditor.paste('testing');
      });

      it('edits the element with the value', function () {
        expect(element.currentValue).to.equal('testing');
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });
  });

  describe('#complete', function () {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('has no behaviour', function () {
      expect(standardEditor.start()).to.equal(undefined);
    });
  });

  describe('#size', function () {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('returns the number of characters', function () {
      expect(standardEditor.size()).to.equal(4);
    });
  });

  describe('#value', function () {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('returns the current value', function () {
      expect(standardEditor.value()).to.equal('test');
    });
  });
});
