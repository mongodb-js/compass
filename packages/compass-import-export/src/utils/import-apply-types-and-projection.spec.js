import apply, {
  transformProjectedTypesStream
} from './import-apply-types-and-projection';

import bson from 'bson';

describe('import-apply-types-and-projection', () => {
  it('should include all fields by default', () => {
    const res = apply(
      { exclude: [], transform: [] },
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
        transform: []
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
        transform: [
          ['birthday', 'Date']
        ]
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
      transform: [
        ['age', 'Number'],
        ['location.activity.sleeping', 'Boolean']
      ]
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
      const res = transformProjectedTypesStream({ exclude: [], transform: [] });
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
        transform: [
          ['sourceVersion', 'Number'],
          ['creationDate', 'Date'],
          ['startDate', 'Date'],
          ['endDate', 'Date']
        ]
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
  describe('bson', () => {
    it('should preserve an ObjectId to an ObjectId', () => {
      const res = apply(
        { exclude: [], transform: [] },
        {
          _id: new bson.ObjectId('5e739e27a4c96922d4435c59')
        }
      );
      expect(res).to.deep.equal({
        _id: new bson.ObjectId('5e739e27a4c96922d4435c59')
      });
    });
    it('should preserve a Date', () => {
      const res = apply(
        { exclude: [], transform: [] },
        {
          _id: new Date('2020-03-19T16:40:38.010Z')
        }
      );
      expect(res).to.deep.equal({
        _id: new Date('2020-03-19T16:40:38.010Z')
      });
    });
  });
  describe('Regression Tests', () => {
    // COMPASS-4204 Data type is not being set during import
    it('should transform csv strings to Number', () => {
      const res = apply(
        {
          exclude: [],
          transform: [
            ['age', 'Number']
          ]
        },
        {
          _id: 'arlo',
          name: 'Arlo',
          age: '5'
        }
      );

      expect(res).to.deep.equal({
        _id: 'arlo',
        name: 'Arlo',
        age: 5
      });
    });
    it('should transform floats if Number specified', () => {
      const spec = {
        exclude: [],
        transform: [
          [ 'Bin_#', 'Number'],
          [ 'House_#', 'Number'],
          [ 'Job_#', 'Number'],
          [ 'Job_doc_#', 'String'],
          [ 'Block', 'Number'],
          [ 'Lot', 'String'],
          [ 'Community_Board', 'Number'],
          [ 'Zip_Code', 'Number'],
          [ 'Permit_Sequence_#', 'String']
        ]
      };
      
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
        NTA_NAME: 'Breezy Point-Belle Harbor-Rockaway Park-Broad Channel'
      };
      const res = apply(spec, doc);
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
        NTA_NAME: 'Breezy Point-Belle Harbor-Rockaway Park-Broad Channel'
      });
    });
    it('should transform strings to floats', () => {
      const res = apply(
        {
          exclude: [],
          transform: [
            ['LATITUDE', 'Number'],
            ['LONGITUDE', 'Number']
          ]
        },
        {
          LATITUDE: '40.601732',
          LONGITUDE: '-73.821199'
        }
      );

      expect(res).to.deep.equal({
        LATITUDE: 40.601732,
        LONGITUDE: -73.821199
      });
    });
  });
});
