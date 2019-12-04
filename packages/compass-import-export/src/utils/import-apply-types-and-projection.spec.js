import apply from './import-apply-types-and-projection';

describe('import-apply-types-and-projection', () => {
  it('should include all fields by default', () => {
    const res = apply([{ path: '_id', checked: true, type: 'String' }], {
      _id: 'arlo'
    });
    expect(res).to.deep.equal({
      _id: 'arlo'
    });
  });
  it('should remove an unchecked path', () => {
    const res = apply(
      [
        { path: '_id', checked: true, type: 'String' },
        { path: 'name', checked: false, type: 'String' }
      ],
      {
        _id: 'arlo',
        name: 'Arlo'
      }
    );

    expect(res).to.deep.equal({
      _id: 'arlo'
    });
  });
  it('should deserialize strings to selected types', () => {
    const res = apply(
      [
        { path: '_id', checked: true, type: 'String' },
        { path: 'name', checked: true, type: 'String' },
        { path: 'birthday', checked: true, type: 'Date' }
      ],
      {
        _id: 'arlo',
        name: 'Arlo',
        birthday: '2014-09-21'
      }
    );

    expect(res).to.deep.equal({
      _id: 'arlo',
      name: 'Arlo',
      birthday: new Date('2014-09-21')
    });
  });
  it('should handle nested objects');
  describe('Weird Cases', () => {
    it('should throw if non ascii ends up in field paths', () => {
      /**
       * NOTE: lucas: Found this weird bug where my apple health data
       * caused failed type conversion bc of a null pointer.
       * This case makes sure that doesn't happen and is mostly
       * so I remember to figure out whats happening later.
       */
      const fields = [
        { path: '﻿type', checked: false, type: 'String' },
        { path: 'sourceName', checked: true, type: 'String' },
        { path: 'sourceVersion', checked: true, type: 'Number' },
        { path: 'creationDate', checked: true, type: 'Date' },
        { path: 'startDate', checked: true, type: 'Date' },
        { path: 'endDate', checked: true, type: 'Date' }
      ];

      const data = {
        creationDate: '2016-11-04 06:30:14 -0400',
        endDate: '2016-11-04 06:30:14 -0400',
        sourceName: 'Clock',
        sourceVersion: '50',
        startDate: '2016-11-03 22:30:00 -0400',
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisInBed'
      };

      expect(apply.bind(null, fields, data)).to.throw();
    });
  });
});
