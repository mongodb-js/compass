import { Element } from 'hadron-document';
import { StandardEditor } from 'components/editor';

describe('StandardEditor', () => {
  describe('#start', () => {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('has no behaviour', () => {
      expect(standardEditor.start()).to.equal(undefined);
    });
  });

  describe('#edit', () => {
    context('when the value is valid for the type', () => {
      const element = new Element('name', 'test', false);
      const standardEditor = new StandardEditor(element);

      before(() => {
        standardEditor.edit('testing');
      });

      it('edits the element with the value', () => {
        expect(element.currentValue).to.equal('testing');
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when editing boolean strings', () => {
      const bool = true;
      const element = new Element('boolean', bool, false);

      context('when the boolean string is valid', () => {
        const standardEditor = new StandardEditor(element);

        before(() => {
          standardEditor.start();
          standardEditor.edit('false');
        });

        it('keeps the string as the current value', () => {
          expect(element.currentValue).to.equal(false);
        });

        it('sets the current value as valid', () => {
          expect(element.isCurrentTypeValid()).to.equal(true);
        });
      });

      context('when the standard string is invalid', () => {
        const standardEditor = new StandardEditor(element);
        const invalidString = 'fal';

        before(() => {
          standardEditor.start();
          standardEditor.edit(invalidString);
        });

        it('keeps the string as the current value', () => {
          expect(element.currentValue).to.equal('fal');
        });

        it('sets the current value as invalid', () => {
          expect(element.isCurrentTypeValid()).to.equal(false);
        });

        it('sets the invalid message', () => {
          expect(element.invalidTypeMessage).to.equal('\'fal\' is not a valid boolean string');
        });
      });
    });
  });

  describe('#paste', () => {
    context('when the string is an object', () => {
      const element = new Element('name', {}, false);
      const standardEditor = new StandardEditor(element);

      before(() => {
        standardEditor.paste('{\"name\": \"test\"}');
      });

      it('converts the element to an object', () => {
        expect(element.elements.at(0).currentKey).to.equal('name');
        expect(element.elements.at(0).currentValue).to.equal('test');
      });

      it('sets the current type as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the string is not an array or object', () => {
      const element = new Element('name', 'test', false);
      const standardEditor = new StandardEditor(element);

      before(() => {
        standardEditor.paste('testing');
      });

      it('edits the element with the value', () => {
        expect(element.currentValue).to.equal('testing');
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });
  });

  describe('#complete', () => {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('has no behaviour', () => {
      expect(standardEditor.start()).to.equal(undefined);
    });
  });

  describe('#size', () => {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('returns the number of characters', () => {
      expect(standardEditor.size()).to.equal(4);
    });
  });

  describe('#value', () => {
    const element = new Element('name', 'test', false);
    const standardEditor = new StandardEditor(element);

    it('returns the current value', () => {
      expect(standardEditor.value()).to.equal('test');
    });
  });
});
