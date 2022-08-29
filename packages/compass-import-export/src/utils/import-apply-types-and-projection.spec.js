import { expect } from 'chai';

import apply, {
  transformProjectedTypesStream,
} from './import-apply-types-and-projection';

import stream from 'stream';
import bson, { ObjectID } from 'bson';

describe('import-apply-types-and-projection', function () {
  it('should include all fields by default', function () {
    const res = apply(
      {
        _id: 'arlo',
      },
      { transform: [], excludeBlanks: true }
    );
    expect(res).to.deep.equal({
      _id: 'arlo',
    });
  });
  it('should remove an unchecked path', function () {
    const res = apply(
      {
        _id: 'arlo',
        name: 'Arlo',
      },
      {
        exclude: ['name'],
      }
    );

    expect(res).to.deep.equal({
      _id: 'arlo',
    });
  });
  it('should deserialize strings to selected types', function () {
    const res = apply(
      {
        _id: 'arlo',
        name: 'Arlo',
        birthday: '2014-09-21',
      },
      {
        exclude: [],
        transform: [['birthday', 'Date']],
      }
    );

    expect(res).to.deep.equal({
      _id: 'arlo',
      name: 'Arlo',
      birthday: new Date('2014-09-21'),
    });
  });
  it('should handle nested objects', function () {
    const doc = {
      _id: 'arlo',
      name: 'Arlo',
      age: '5',
      location: {
        place: 'home',
        activity: {
          sleeping: 'true',
          is: 'on the couch',
        },
      },
    };

    const res = apply(doc, {
      transform: [
        ['age', 'Number'],
        ['location.activity.sleeping', 'Boolean'],
      ],
    });

    expect(res).to.deep.equal({
      _id: 'arlo',
      name: 'Arlo',
      age: 5,
      location: {
        place: 'home',
        activity: {
          sleeping: true,
          is: 'on the couch',
        },
      },
    });
  });
  describe('transformProjectedTypesStream', function () {
    it('should return a passthrough if nothing to actually transform', function () {
      const res = transformProjectedTypesStream({
        exclude: [],
        transform: [],
        ignoreBlanks: false,
      });
      expect(res.constructor.name).to.equal('PassThrough');
    });
    it('should return an error if theres a type cast which fails', function (done) {
      const src = stream.Readable.from([
        {
          _id: 1,
          stringToCastToDecimal128: 'ME ERROR',
        },
      ]);

      const transform = transformProjectedTypesStream({
        transform: [['stringToCastToDecimal128', 'Decimal128']],
      });
      const dest = new stream.Writable({
        objectMode: true,
        write: function (doc, encoding, next) {
          return next(null);
        },
      });
      stream.pipeline(src, transform, dest, function (err) {
        expect(
          err.message.includes(
            'TypeError: ME ERROR not a valid Decimal128 string'
          )
        );
        done();
      });
    });
  });
  describe('Weird Cases', function () {
    it('should handle non ascii in field paths', function () {
      /**
       * NOTE: lucas: Found this weird bug where my apple health data
       * caused failed type conversion bc of a null pointer.
       * Resulted in changing the design and now this weird throw
       * shouldn't happen anymore.
       */
      const spec = {
        exclude: ['﻿type'],
        transform: [
          ['sourceVersion', 'Number'],
          ['creationDate', 'Date'],
          ['startDate', 'Date'],
          ['endDate', 'Date'],
        ],
      };

      const data = {
        creationDate: '2016-11-04 06:30:14 -0400',
        endDate: '2016-11-04 06:30:14 -0400',
        sourceName: 'Clock',
        sourceVersion: '50',
        startDate: '2016-11-03 22:30:00 -0400',
        type: 'HKCategoryTypeIdentifierSleepAnalysis',
        value: 'HKCategoryValueSleepAnalysisInBed',
      };

      expect(apply.bind(null, spec, data)).to.not.throw();
    });
  });
  describe('bson', function () {
    it('should preserve an ObjectID to an ObjectID', function () {
      const res = apply({
        _id: new bson.ObjectID('5e739e27a4c96922d4435c59'),
      });
      expect(res).to.deep.equal({
        _id: new bson.ObjectID('5e739e27a4c96922d4435c59'),
      });
    });
    it('should preserve a Date', function () {
      const res = apply({
        _id: new Date('2020-03-19T16:40:38.010Z'),
      });
      expect(res).to.deep.equal({
        _id: new Date('2020-03-19T16:40:38.010Z'),
      });
    });
  });
  describe('Regression Tests', function () {
    // COMPASS-5971 Importing JSON document from file drops deeply nested fields
    it('should parse deeply nested objects', function () {
      const res = apply(
        {
          supermarket: {
            fruits: {
              oranges: {
                amount: {
                  '2022-01-15': 1.66,
                  '2022-02-16': 1.22,
                  '2022-03-13': 1.11,
                  '2022-04-14': 7.69,
                },
              },
              apples: {
                amount: {
                  '2022-01-15': 3.47,
                  '2022-02-14': 4.18,
                  '2022-03-15': 4.18,
                },
              },
              currency: 'usd',
            },
          },
          test: '123',
        },
        {
          exclude: [],
          transform: [],
        }
      );

      expect(res).to.deep.equal({
        supermarket: {
          fruits: {
            oranges: {
              amount: {
                '2022-01-15': 1.66,
                '2022-02-16': 1.22,
                '2022-03-13': 1.11,
                '2022-04-14': 7.69,
              },
            },
            apples: {
              amount: {
                '2022-01-15': 3.47,
                '2022-02-14': 4.18,
                '2022-03-15': 4.18,
              },
            },
            currency: 'usd',
          },
        },
        test: '123',
      });
    });

    // COMPASS-4204 Data type is not being set during import
    it('should transform csv strings to Number', function () {
      const res = apply(
        {
          _id: 'arlo',
          name: 'Arlo',
          age: '5',
        },
        {
          exclude: [],
          transform: [['age', 'Number']],
        }
      );

      expect(res).to.deep.equal({
        _id: 'arlo',
        name: 'Arlo',
        age: 5,
      });
    });
    it('should transform floats if Number specified', function () {
      const doc = {
        BOROUGH: 'QUEENS',
        'Bin_#': '4297149',
        'House_#': '17',
        Street_Name: 'WEST 16 ROAD',
        'Job_#': '440325738',
        'Job_doc_#': '01',
        Job_Type: 'A2',
        Self_Cert: 'N',
        Block: '15320',
        Lot: '00048',
        Community_Board: '414',
        Zip_Code: '11693',
        Bldg_Type: '1',
        Residential: 'YES',
        Special_District_1: '',
        Special_District_2: '',
        Work_Type: 'OT',
        Permit_Status: 'ISSUED',
        Filing_Status: 'RENEWAL',
        Permit_Type: 'EW',
        'Permit_Sequence_#': '04',
        Permit_Subtype: 'OT',
        Oil_Gas: '',
        Site_Fill: 'NOT APPLICABLE',
        Filing_Date: '05/21/2018 12:00:00 AM',
        Issuance_Date: '05/21/2018 12:00:00 AM',
        Expiration_Date: '05/15/2019 12:00:00 AM',
        Job_Start_Date: '04/07/2017 12:00:00 AM',
        "Permittee's_First_Name": 'DONALD',
        "Permittee's_Last_Name": "O'SULLIVAN",
        "Permittee's_Business_Name": 'NAVILLUS TILE INC',
        "Permittee's_Phone_#": '2127501808',
        "Permittee's_License_Type": 'GC',
        "Permittee's_License_#": '0015163',
        Act_as_Superintendent: '',
        "Permittee's_Other_Title": '',
        HIC_License: '',
        "Site_Safety_Mgr's_First_Name": '',
        "Site_Safety_Mgr's_Last_Name": '',
        Site_Safety_Mgr_Business_Name: '',
        'Superintendent_First_&_Last_Name': '',
        Superintendent_Business_Name: '',
        "Owner's_Business_Type": 'INDIVIDUAL',
        'Non-Profit': 'N',
        "Owner's_Business_Name": 'TERENCE HAIRSTON ARCHITECT, PLLC',
        "Owner's_First_Name": 'TERENCE',
        "Owner's_Last_Name": 'HAIRSTON',
        "Owner's_House_#": '16',
        "Owner's_House_Street_Name": 'WEST 36TH STREET',
        'Owner’s_House_City': 'NEW YORK',
        'Owner’s_House_State': 'NY',
        'Owner’s_House_Zip_Code': '10018',
        "Owner's_Phone_#": '9176924778',
        DOBRunDate: '05/22/2018 12:00:00 AM',
        PERMIT_SI_NO: '3463269',
        LATITUDE: '40.601732',
        LONGITUDE: '-73.821199',
        COUNCIL_DISTRICT: '32',
        CENSUS_TRACT: '107201',
        NTA_NAME: 'Breezy Point-Belle Harbor-Rockaway Park-Broad Channel',
      };
      const res = apply(doc, {
        exclude: [],
        transform: [
          ['Bin_#', 'Number'],
          ['House_#', 'Number'],
          ['Job_#', 'Number'],
          ['Job_doc_#', 'String'],
          ['Block', 'Number'],
          ['Lot', 'String'],
          ['Community_Board', 'Number'],
          ['Zip_Code', 'Number'],
          ['Permit_Sequence_#', 'String'],
        ],
      });
      expect(res).to.deep.equal({
        BOROUGH: 'QUEENS',
        'Bin_#': 4297149,
        'House_#': 17,
        Street_Name: 'WEST 16 ROAD',
        'Job_#': 440325738,
        'Job_doc_#': '01',
        Job_Type: 'A2',
        Self_Cert: 'N',
        Block: 15320,
        Lot: '00048',
        Community_Board: 414,
        Zip_Code: 11693,
        Bldg_Type: '1',
        Residential: 'YES',
        Special_District_1: '',
        Special_District_2: '',
        Work_Type: 'OT',
        Permit_Status: 'ISSUED',
        Filing_Status: 'RENEWAL',
        Permit_Type: 'EW',
        'Permit_Sequence_#': '04',
        Permit_Subtype: 'OT',
        Oil_Gas: '',
        Site_Fill: 'NOT APPLICABLE',
        Filing_Date: '05/21/2018 12:00:00 AM',
        Issuance_Date: '05/21/2018 12:00:00 AM',
        Expiration_Date: '05/15/2019 12:00:00 AM',
        Job_Start_Date: '04/07/2017 12:00:00 AM',
        "Permittee's_First_Name": 'DONALD',
        "Permittee's_Last_Name": "O'SULLIVAN",
        "Permittee's_Business_Name": 'NAVILLUS TILE INC',
        "Permittee's_Phone_#": '2127501808',
        "Permittee's_License_Type": 'GC',
        "Permittee's_License_#": '0015163',
        Act_as_Superintendent: '',
        "Permittee's_Other_Title": '',
        HIC_License: '',
        "Site_Safety_Mgr's_First_Name": '',
        "Site_Safety_Mgr's_Last_Name": '',
        Site_Safety_Mgr_Business_Name: '',
        'Superintendent_First_&_Last_Name': '',
        Superintendent_Business_Name: '',
        "Owner's_Business_Type": 'INDIVIDUAL',
        'Non-Profit': 'N',
        "Owner's_Business_Name": 'TERENCE HAIRSTON ARCHITECT, PLLC',
        "Owner's_First_Name": 'TERENCE',
        "Owner's_Last_Name": 'HAIRSTON',
        "Owner's_House_#": '16',
        "Owner's_House_Street_Name": 'WEST 36TH STREET',
        'Owner’s_House_City': 'NEW YORK',
        'Owner’s_House_State': 'NY',
        'Owner’s_House_Zip_Code': '10018',
        "Owner's_Phone_#": '9176924778',
        DOBRunDate: '05/22/2018 12:00:00 AM',
        PERMIT_SI_NO: '3463269',
        LATITUDE: '40.601732',
        LONGITUDE: '-73.821199',
        COUNCIL_DISTRICT: '32',
        CENSUS_TRACT: '107201',
        NTA_NAME: 'Breezy Point-Belle Harbor-Rockaway Park-Broad Channel',
      });
    });
    it('should transform strings to floats', function () {
      const res = apply(
        {
          LATITUDE: '40.601732',
          LONGITUDE: '-73.821199',
        },
        {
          transform: [
            ['LATITUDE', 'Number'],
            ['LONGITUDE', 'Number'],
          ],
        }
      );

      expect(res).to.deep.equal({
        LATITUDE: 40.601732,
        LONGITUDE: -73.821199,
      });
    });
  });
  describe('ignoreBlanks', function () {
    it('should not remove empty strings by default', function () {
      const source = {
        _id: 1,
        empty: '',
      };
      const result = apply(source, { transform: [], exclude: [] });
      expect(result).to.deep.equal(source);
    });

    it('should remove empty strings', function () {
      const source = {
        _id: 1,
        empty: '',
      };
      const result = apply(source, {
        transform: [],
        exclude: [],
        ignoreBlanks: true,
      });
      expect(result).to.deep.equal({ _id: 1 });
    });
    it('should not convert ObjectID to Object', function () {
      const source = {
        _id: new ObjectID('5e74f99c182d2e9e6572c388'),
        empty: '',
      };
      const result = apply(source, {
        transform: ['_id', 'ObjectID'],
        ignoreBlanks: true,
      });
      expect(result).to.deep.equal({
        _id: new ObjectID('5e74f99c182d2e9e6572c388'),
      });
    });

    it('should remove empty strings but leave falsy values', function () {
      const source = {
        _id: 1,
        empty: '',
        nulled: null,
        falsed: false,
        undef: undefined,
      };
      const result = apply(source, { ignoreBlanks: true });
      expect(result).to.deep.equal({
        _id: 1,
        nulled: null,
        falsed: false,
        undef: undefined,
      });
    });
    it('should tolerate empty docs if a bad projection was specified', function () {
      expect(apply({})).to.deep.equal({});
    });
    it('should tolerate arrays', function () {
      expect(apply([{}])).to.deep.equal([{}]);
    });
    describe('stream', function () {
      it('should return a passthrough if not ignoring blanks', function () {
        const transform = transformProjectedTypesStream({
          exclude: [],
          transform: [],
          ignoreBlanks: false,
        });
        expect(transform).to.be.instanceOf(stream.PassThrough);
      });
      it('should remove blanks via a transform', function (done) {
        const src = stream.Readable.from([
          {
            _id: 1,
            empty: '',
            nulled: null,
            falsed: false,
            undef: undefined,
          },
        ]);

        const transform = transformProjectedTypesStream({ ignoreBlanks: true });
        let result;
        const dest = new stream.Writable({
          objectMode: true,
          write: function (doc, encoding, next) {
            result = doc;
            return next(null);
          },
        });
        stream.pipeline(src, transform, dest, function (err) {
          if (err) {
            return done(err);
          }

          expect(result).to.deep.equal({
            _id: 1,
            nulled: null,
            falsed: false,
            undef: undefined,
          });
          done();
        });
      });
    });
  });
});
