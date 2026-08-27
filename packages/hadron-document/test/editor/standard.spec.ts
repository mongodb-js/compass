import { Element, ElementEvents } from '../../src';
import {
  DateEditor,
  ObjectIdEditor,
  StandardEditor,
  UUIDEditor,
} from '../../src/editor';
import { Binary, ObjectId } from 'bson';
import { expect } from 'chai';
import Sinon from 'sinon';

describe('StandardEditor', function () {
  describe('#start', function () {
    const element = new Element('name', 'test');
    const standardEditor = new StandardEditor(element);

    it('has no behaviour', function () {
      expect(standardEditor.start()).to.equal(undefined);
    });
  });

  describe('#edit', function () {
    context('when the value is valid for the type', function () {
      const element = new Element('name', 'test');
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
      const element = new Element('boolean', bool);

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
      const element = new Element('name', {});
      const standardEditor = new StandardEditor(element);

      before(function () {
        standardEditor.paste('{"name": "test"}');
      });

      it('converts the element to an object', function () {
        expect(element.elements?.at(0)?.currentKey).to.equal('name');
        expect(element.elements?.at(0)?.currentValue).to.equal('test');
      });

      it('sets the current type as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the string is not an array or object', function () {
      const element = new Element('name', 'test');
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
    let element: Element;
    let standardEditor: StandardEditor;
    let editCompleted: Sinon.SinonSpy;

    beforeEach(function () {
      element = new Element('name', 'test');
      standardEditor = new StandardEditor(element);
      editCompleted = Sinon.spy();
      element.on(ElementEvents.EditCompleted, editCompleted);
    });

    it('emits EditCompleted with the element when the value changed', function () {
      standardEditor.start();
      standardEditor.edit('testing');
      standardEditor.complete();

      expect(editCompleted).to.have.been.calledOnceWithExactly(element);
    });

    it('does not emit EditCompleted when the value did not change', function () {
      standardEditor.start();
      standardEditor.complete();

      expect(editCompleted).to.not.have.been.called;
    });

    it('does not emit EditCompleted again for a previous edit', function () {
      standardEditor.start();
      standardEditor.edit('testing');
      standardEditor.complete();
      standardEditor.start();
      standardEditor.complete();

      expect(editCompleted).to.have.been.calledOnce;
    });

    it('does not emit EditCompleted when completed without starting', function () {
      standardEditor.start();
      standardEditor.edit('testing');
      standardEditor.complete();
      standardEditor.complete();

      expect(editCompleted).to.have.been.calledOnce;
    });

    it('emits EditCompleted once when the type is changed mid-edit', function () {
      standardEditor.start();
      standardEditor.edit('testing');
      // The type dropdown is rendered inside the open editor, and changing to
      // Date internally completes a throwaway editor of its own.
      element.changeType('Date');
      standardEditor.complete();

      expect(editCompleted).to.have.been.calledOnceWithExactly(element);
    });

    // These editors convert their value to an editable string on start and
    // back again on complete, which must not read as an edit by itself.
    const roundTripping = [
      ['DateEditor', DateEditor, () => new Element('field', new Date(0))],
      [
        'ObjectIdEditor',
        ObjectIdEditor,
        () => new Element('field', new ObjectId()),
      ],
      [
        'UUIDEditor',
        UUIDEditor,
        () => {
          const el = new Element(
            'field',
            Binary.createFromHexString(
              '3b241101e2bb425587caf2d21b836b5a',
              Binary.SUBTYPE_UUID
            )
          );
          el.currentType = 'UUID';
          return el;
        },
      ],
    ] as const;

    for (const [name, Editor, makeElement] of roundTripping) {
      it(`does not emit EditCompleted for an untouched ${name}`, function () {
        const el = makeElement();
        const spy = Sinon.spy();
        el.on(ElementEvents.EditCompleted, spy);
        const editor = new Editor(el);

        editor.start();
        editor.complete();

        expect(spy).to.not.have.been.called;
      });

      it(`emits EditCompleted for an edited ${name}`, function () {
        const el = makeElement();
        const spy = Sinon.spy();
        el.on(ElementEvents.EditCompleted, spy);
        const editor = new Editor(el);

        editor.start();
        editor.edit(
          editor
            .value()
            .replace(/[0-9]/, (digit) => (digit === '1' ? '2' : '1'))
        );
        editor.complete();

        expect(spy).to.have.been.calledOnceWithExactly(el);
      });
    }
  });

  describe('#size', function () {
    const element = new Element('name', 'test');
    const standardEditor = new StandardEditor(element);

    it('returns the number of characters', function () {
      expect(standardEditor.size()).to.equal(4);
    });
  });

  describe('#value', function () {
    const element = new Element('name', 'test');
    const standardEditor = new StandardEditor(element);

    it('returns the current value', function () {
      expect(standardEditor.value()).to.equal('test');
    });
  });
});
