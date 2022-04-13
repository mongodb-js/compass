import { Element } from '../../src';
import { DateEditor } from '../../src/editor';
import { expect } from 'chai';

describe('DateEditor', function () {
  describe('#start', function () {
    const formattedDateString = '2017-01-01T00:00:00.000+00:00';
    const date = new Date(formattedDateString);
    const element = new Element('date', date, false);

    context('when the current type is valid (not yet edited)', function () {
      const dateEditor = new DateEditor(element);

      before(function () {
        dateEditor.start();
      });

      it('edits the element with the formatted value', function () {
        expect(element.currentValue).to.equal(formattedDateString);
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context(
      'when the current type is not valid (edited, blurred, and edited again)',
      function () {
        const dateEditor = new DateEditor(element);

        before(function () {
          dateEditor.start();
          dateEditor.edit('not valid');
          dateEditor.complete();
          dateEditor.start();
        });

        it('edits the element with the raw value', function () {
          expect(element.currentValue).to.equal('not valid');
        });

        it('sets the current value as invalid', function () {
          expect(element.isCurrentTypeValid()).to.equal(false);
        });

        it('sets the invalid message', function () {
          expect(element.invalidTypeMessage).to.equal(
            'not valid is not in a valid date format'
          );
        });
      }
    );
  });

  describe('#edit', function () {
    const dateString = '2017-01-01 00:00:00.000';
    const date = new Date(dateString);
    const element = new Element('date', date, false);

    context('when the date string is valid', function () {
      const dateEditor = new DateEditor(element);
      const newValidString = '2017-01-01 12:00:00.000';

      before(function () {
        dateEditor.start();
        dateEditor.edit(newValidString);
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal(newValidString);
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the date string is invalid', function () {
      const dateEditor = new DateEditor(element);
      const invalidString = 'nope';

      before(function () {
        dateEditor.start();
        dateEditor.edit(invalidString);
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', function () {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', function () {
        expect(element.invalidTypeMessage).to.equal(
          'nope is not in a valid date format'
        );
      });
    });
  });

  describe('#complete', function () {
    const dateString = '2017-01-01 00:00:00.000';
    const date = new Date(dateString);
    const element = new Element('date', date, false);
    context('when the date string is valid', function () {
      const dateEditor = new DateEditor(element);
      const newValidString = '2017-01-01 12:00:00.000';

      before(function () {
        dateEditor.start();
        dateEditor.edit(newValidString);
        dateEditor.complete();
      });

      it('casts the current value to the real type', function () {
        expect(element.currentValue).to.deep.equal(new Date(newValidString));
      });

      it('sets the current value as valid', function () {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the date string is invalid', function () {
      const dateEditor = new DateEditor(element);
      const invalidString = 'nope';

      before(function () {
        dateEditor.start();
        dateEditor.edit(invalidString);
        dateEditor.complete();
      });

      it('keeps the string as the current value', function () {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', function () {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', function () {
        expect(element.invalidTypeMessage).to.equal(
          'nope is not in a valid date format'
        );
      });
    });
  });

  describe('#size', function () {
    context('when the ui is in edit mode', function () {
      const dateString = '2017-01-01 00:00:00.000';
      const date = new Date(dateString);
      const element = new Element('date', date, false);

      const dateEditor = new DateEditor(element);

      before(function () {
        dateEditor.edit('2014');
      });

      it('returns the number of chars in the input field', function () {
        expect(dateEditor.size(true)).to.equal(4);
      });
    });

    context('when the ui is not in edit mode', function () {
      context('when the date is valid', function () {
        const dateString = '2017-01-01 00:00:00.000';
        const date = new Date(dateString);
        const element = new Element('date', date, false);

        const dateEditor = new DateEditor(element);

        it('returns the number of chars in the formatted string', function () {
          expect(dateEditor.size(false)).to.equal(29);
        });
      });

      context('when the date is not valid', function () {
        const dateString = '2017-01-01 00:00:00.000';
        const date = new Date(dateString);
        const element = new Element('date', date, false);

        const dateEditor = new DateEditor(element);

        before(function () {
          dateEditor.edit('testing');
        });

        it('returns the number of chars in the raw string', function () {
          expect(dateEditor.size(false)).to.equal(7);
        });
      });
    });
  });

  describe('#value', function () {
    context('when the ui is in edit mode', function () {
      const dateString = '2017-01-01 00:00:00.000';
      const date = new Date(dateString);
      const element = new Element('date', date, false);

      const dateEditor = new DateEditor(element);

      before(function () {
        dateEditor.start();
        dateEditor.edit('2014');
      });

      it('returns the raw string value', function () {
        expect(dateEditor.value()).to.equal('2014');
      });
    });

    context('when the ui is not in edit mode', function () {
      context('when the date is valid', function () {
        const formattedDateString = '2017-01-01T00:00:00.000+00:00';
        const date = new Date(formattedDateString);
        const element = new Element('date', date, false);

        const dateEditor = new DateEditor(element);

        it('returns the formatted string', function () {
          expect(dateEditor.value()).to.equal(formattedDateString);
        });
      });

      context('when the date is not valid', function () {
        const dateString = '2017-01-01 00:00:00.000';
        const date = new Date(dateString);
        const element = new Element('date', date, false);

        const dateEditor = new DateEditor(element);

        before(function () {
          dateEditor.edit('testing');
        });

        it('returns the raw string', function () {
          expect(dateEditor.value()).to.equal('testing');
        });
      });
    });
  });
});
