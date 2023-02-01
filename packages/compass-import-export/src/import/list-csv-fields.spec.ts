import assert from 'assert';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs';
import { guessFileType } from './guess-filetype';
import { listCSVFields } from './list-csv-fields';
import { fixtures } from '../../test/fixtures';

const expectedFieldsByFile = {
  'bad.csv': ['1', '2', '3'],
  'good-commas.csv': ['_id', 'value'],
  'good-tabs.csv': ['_id', 'value'],
  'number-transform.csv': [
    'BOROUGH',
    'Bin_#',
    'House_#',
    'Street_Name',
    'Job_#',
    'Job_doc_#',
    'Job_Type',
    'Self_Cert',
    'Block',
    'Lot',
    'Community_Board',
    'Zip_Code',
    'Bldg_Type',
    'Residential',
    'Special_District_1',
    'Special_District_2',
    'Work_Type',
    'Permit_Status',
    'Filing_Status',
    'Permit_Type',
    'Permit_Sequence_#',
    'Permit_Subtype',
    'Oil_Gas',
    'Site_Fill',
    'Filing_Date',
    'Issuance_Date',
    'Expiration_Date',
    'Job_Start_Date',
    "Permittee's_First_Name",
    "Permittee's_Last_Name",
    "Permittee's_Business_Name",
    "Permittee's_Phone_#",
    "Permittee's_License_Type",
    "Permittee's_License_#",
    'Act_as_Superintendent',
    "Permittee's_Other_Title",
    'HIC_License',
    "Site_Safety_Mgr's_First_Name",
    "Site_Safety_Mgr's_Last_Name",
    'Site_Safety_Mgr_Business_Name',
    'Superintendent_First_&_Last_Name',
    'Superintendent_Business_Name',
    "Owner's_Business_Type",
    'Non-Profit',
    "Owner's_Business_Name",
    "Owner's_First_Name",
    "Owner's_Last_Name",
    "Owner's_House_#",
    "Owner's_House_Street_Name",
    'Owner’s_House_City',
    'Owner’s_House_State',
    'Owner’s_House_Zip_Code',
    "Owner's_Phone_#",
    'DOBRunDate',
    'PERMIT_SI_NO',
    'LATITUDE',
    'LONGITUDE',
    'COUNCIL_DISTRICT',
    'CENSUS_TRACT',
    'NTA_NAME',
  ],
  'sparse.csv': ['foo', 'bar', 'baz'],
  'semicolons.csv': ['a', 'b', 'c', 'd'],
  'spaces.csv': ['a', 'b', 'c', 'd'],
  'array.csv': ['a', 'foo', 'bar', 'z', 'notes'],
  'object.csv': ['a', 'foo.bar', 'foo.baz.qux', 'foo.baz.quux', 'z', 'notes'],
  'complex.csv': ['foo', 'foo.bar', 'foo.bar.baz', 'notes'],
} as const;

describe('listCSVFields', function () {
  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);
    it(`detects correct fields for ${basename}`, async function () {
      const typeResult = await guessFileType({
        input: fs.createReadStream(filepath),
      });
      assert(typeResult.type === 'csv');
      const csvDelimiter = typeResult.csvDelimiter;
      const fieldsResult = await listCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
      });

      const expectedFields =
        expectedFieldsByFile[basename as keyof typeof expectedFieldsByFile];
      if (expectedFields) {
        expect(fieldsResult).to.deep.equal(expectedFields);
      } else {
        expect(fieldsResult).to.equal(
          `add an entry for ${basename} to expectedFields`
        );
      }
    });
  }
});
