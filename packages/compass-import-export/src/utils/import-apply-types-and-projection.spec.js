import apply, {
  transformProjectedTypesStream
} from './import-apply-types-and-projection';

describe('import-apply-types-and-projection', () => {
  it('should include all fields by default', () => {
    const res = apply(
      { exclude: [], transform: {} },
      {
        _id: 'arlo'
      }
    );
    expect(res).to.deep.equal({
      _id: 'arlo'
    });
  });
  it('should remove an unchecked path', () => {
    const res = apply(
      {
        exclude: ['name'],
        transform: {}
      },
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
      {
        exclude: [],
        transform: {
          birthday: 'Date'
        }
      },
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
  it('should handle nested objects', () => {
    const doc = {
      _id: 'arlo',
      name: 'Arlo',
      age: '5',
      location: {
        place: 'home',
        activity: {
          sleeping: 'true',
          is: 'on the couch'
        }
      }
    };

    const spec = {
      exclude: [],
      transform: {
        age: 'Number',
        'location.activity.sleeping': 'Boolean'
      }
    };

    const res = apply(spec, doc);

    expect(res).to.deep.equal({
      _id: 'arlo',
      name: 'Arlo',
      age: 5,
      location: {
        place: 'home',
        activity: {
          sleeping: true,
          is: 'on the couch'
        }
      }
    });
  });
  describe('transformProjectedTypesStream', () => {
    it('should return a passthrough if nothing to actually transform', () => {
      const res = transformProjectedTypesStream({ exclude: [], transform: {} });
      expect(res.constructor.name).to.equal('PassThrough');
    });
  });
  describe('Weird Cases', () => {
    it('should handle non ascii in field paths', () => {
      /**
       * NOTE: lucas: Found this weird bug where my apple health data
       * caused failed type conversion bc of a null pointer.
       * Resulted in changing the design and now this weird throw
       * shouldn't happen anymore.
       */
      const spec = {
        exclude: ['﻿type'],
        transform: {
          sourceVersion: 'Number',
          creationDate: 'Date',
          startDate: 'Date',
          endDate: 'Date'
        }
      };

      const data = {
        creationDate: '2016-11-04 06:30:14 -0400',
        endDate: '2016-11-04 06:30:14 -0400',
        sourceName: 'Clock',
        sourceVersion: '50',
        startDate: '2016-11-03 22:30:00 -0400',
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisInBed'
      };

      expect(apply.bind(null, spec, data)).to.not.throw();
    });
  });
});
