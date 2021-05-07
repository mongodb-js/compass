import { Element } from 'hadron-document';
import { DateEditor } from 'components/editor';
import moment from 'moment-timezone';

describe('DateEditor', () => {
  describe('#start', () => {
    const dateString = '2017-01-01 00:00:00.000';
    const formattedDateString = '2017-01-01T00:00:00.000+00:00';
    const tz = 'UTC';
    const date = moment.tz(dateString, tz);
    const element = new Element('date', date, false);

    context('when the current type is valid (not yet edited)', () => {
      const dateEditor = new DateEditor(element, tz);

      before(() => {
        dateEditor.start();
      });

      it('edits the element with the formatted value', () => {
        expect(element.currentValue).to.equal(formattedDateString);
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the current type is not valid (edited, blurred, and edited again)', () => {
      const dateEditor = new DateEditor(element, tz);

      before(() => {
        dateEditor.start();
        dateEditor.edit('not valid');
        dateEditor.complete();
        dateEditor.start();
      });

      it('edits the element with the raw value', () => {
        expect(element.currentValue).to.equal('not valid');
      });

      it('sets the current value as invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('not valid is not in a valid date format');
      });
    });
  });

  describe('#edit', () => {
    const dateString = '2017-01-01 00:00:00.000';
    const date = new Date(dateString);
    const element = new Element('date', date, false);
    const tz = 'UTC';

    context('when the date string is valid', () => {
      const dateEditor = new DateEditor(element, tz);
      const newValidString = '2017-01-01 12:00:00.000';

      before(() => {
        dateEditor.start();
        dateEditor.edit(newValidString);
      });

      it('keeps the string as the current value', () => {
        expect(element.currentValue).to.equal(newValidString);
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the date string is invalid', () => {
      const dateEditor = new DateEditor(element, tz);
      const invalidString = 'nope';

      before(() => {
        dateEditor.start();
        dateEditor.edit(invalidString);
      });

      it('keeps the string as the current value', () => {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('nope is not in a valid date format');
      });
    });
  });

  describe('#complete', () => {
    const dateString = '2017-01-01 00:00:00.000';
    const date = new Date(dateString);
    const element = new Element('date', date, false);
    const tz = 'UTC';

    context('when the date string is valid', () => {
      const dateEditor = new DateEditor(element, tz);
      const newValidString = '2017-01-01 12:00:00.000';

      before(() => {
        dateEditor.start();
        dateEditor.edit(newValidString);
        dateEditor.complete();
      });

      it('casts the current value to the real type', () => {
        expect(element.currentValue).to.deep.equal(new Date(newValidString));
      });

      it('sets the current value as valid', () => {
        expect(element.isCurrentTypeValid()).to.equal(true);
      });
    });

    context('when the date string is invalid', () => {
      const dateEditor = new DateEditor(element, tz);
      const invalidString = 'nope';

      before(() => {
        dateEditor.start();
        dateEditor.edit(invalidString);
        dateEditor.complete();
      });

      it('keeps the string as the current value', () => {
        expect(element.currentValue).to.equal('nope');
      });

      it('sets the current value as invalid', () => {
        expect(element.isCurrentTypeValid()).to.equal(false);
      });

      it('sets the invalid message', () => {
        expect(element.invalidTypeMessage).to.equal('nope is not in a valid date format');
      });
    });
  });

  describe('#size', () => {
    context('when the ui is in edit mode', () => {
      const dateString = '2017-01-01 00:00:00.000';
      const date = new Date(dateString);
      const element = new Element('date', date, false);
      const tz = 'UTC';

      const dateEditor = new DateEditor(element, tz);

      before(() => {
        dateEditor.edit('2014');
      });

      it('returns the number of chars in the input field', () => {
        expect(dateEditor.size(true)).to.equal(4);
      });
    });

    context('when the ui is not in edit mode', () => {
      context('when the date is valid', () => {
        const dateString = '2017-01-01 00:00:00.000';
        const date = new Date(dateString);
        const element = new Element('date', date, false);
        const tz = 'UTC';

        const dateEditor = new DateEditor(element, tz);

        it('returns the number of chars in the formatted string', () => {
          expect(dateEditor.size(false)).to.equal(29);
        });
      });

      context('when the date is not valid', () => {
        const dateString = '2017-01-01 00:00:00.000';
        const date = new Date(dateString);
        const element = new Element('date', date, false);
        const tz = 'UTC';

        const dateEditor = new DateEditor(element, tz);

        before(() => {
          dateEditor.edit('testing');
        });

        it('returns the number of chars in the raw string', () => {
          expect(dateEditor.size(false)).to.equal(7);
        });
      });
    });
  });

  describe('#value', () => {
    context('when the ui is in edit mode', () => {
      const dateString = '2017-01-01 00:00:00.000';
      const date = new Date(dateString);
      const element = new Element('date', date, false);
      const tz = 'UTC';

      const dateEditor = new DateEditor(element, tz);

      before(() => {
        dateEditor.edit('2014');
      });

      it('returns the raw string value', () => {
        expect(dateEditor.value(true)).to.equal('2014');
      });
    });

    context('when the ui is not in edit mode', () => {
      context('when the date is valid', () => {
        const dateString = '2017-01-01 00:00:00.000';
        const formattedDateString = '2017-01-01T00:00:00.000+00:00';
        const tz = 'UTC';
        const date = moment.tz(dateString, tz);
        const element = new Element('date', date, false);

        const dateEditor = new DateEditor(element, tz);


        it('returns the formatted string', () => {
          expect(dateEditor.value(false)).to.equal(formattedDateString);
        });
      });

      context('when the date is not valid', () => {
        const dateString = '2017-01-01 00:00:00.000';
        const date = new Date(dateString);
        const element = new Element('date', date, false);
        const tz = 'UTC';

        const dateEditor = new DateEditor(element, tz);

        before(() => {
          dateEditor.edit('testing');
        });

        it('returns the raw string', () => {
          expect(dateEditor.value(false)).to.equal('testing');
        });
      });
    });
  });
});
