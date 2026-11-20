import { expect } from 'chai';

import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import {
  doesQueryHaveExtraOptionsSet,
  formatQueryValueForEditor,
  isEqualDefaultQuery,
  mapQueryToFormFields,
} from './query';

describe('#formatQueryValueForEditor', function () {
  it('formats values as JavaScript expressions', function () {
    expect(formatQueryValueForEditor({ _id: 42 })).to.equal('{ _id: 42 }');
  });

  it('formats undefined as an empty string', function () {
    expect(formatQueryValueForEditor(undefined)).to.equal('');
  });
});

describe('#doesQueryHaveExtraOptionsSet', function () {
  it('returns true when there is a non filter option, false otherwise', async function () {
    const defaultFields = await mapQueryToFormFields({}, DEFAULT_FIELD_VALUES);

    expect(
      doesQueryHaveExtraOptionsSet({
        ...defaultFields,
      })
    ).to.be.false;
    expect(
      doesQueryHaveExtraOptionsSet({
        ...defaultFields,
        filter: {
          valid: true,
          string: '{test: 2}',
          value: {
            test: 2,
          },
        },
      })
    ).to.be.false;
    expect(
      doesQueryHaveExtraOptionsSet({
        ...defaultFields,
        sort: {
          valid: true,
          string: '[["a", -1]]',
          value: [['a', -1]],
        },
      })
    ).to.be.true;
    expect(
      doesQueryHaveExtraOptionsSet({
        ...defaultFields,
        skip: {
          valid: true,
          string: '25',
          value: 25,
        },
      })
    ).to.be.true;
    expect(
      doesQueryHaveExtraOptionsSet({
        ...defaultFields,
        project: {
          valid: true,
          string: '{test: 1}',
          value: {
            test: 1,
          },
        },
      })
    ).to.be.true;
    expect(
      doesQueryHaveExtraOptionsSet({
        ...defaultFields,
        project: {
          valid: false,
          string: '{test: ',
          value: null,
        },
      })
    ).to.be.true;
  });
});

describe('#isEqualDefaultQuery', function () {
  it('is true for default fields', async function () {
    const fields = await mapQueryToFormFields({}, DEFAULT_FIELD_VALUES);
    expect(isEqualDefaultQuery(fields)).to.be.true;
  });

  it('is false when a field is valid but changed from the default', async function () {
    const fields = await mapQueryToFormFields({}, DEFAULT_FIELD_VALUES);
    expect(
      isEqualDefaultQuery({
        ...fields,
        project: { valid: true, string: '{ name: 1 }', value: { name: 1 } },
      })
    ).to.be.false;
  });

  for (const property of ['project', 'sort'] as const) {
    it(`is false when ${property} is invalid but its value is the default`, async function () {
      const fields = await mapQueryToFormFields({}, DEFAULT_FIELD_VALUES);
      expect(
        isEqualDefaultQuery({
          ...fields,
          [property]: { valid: false, string: '{ name: ', value: null },
        })
      ).to.be.false;
    });
  }
});
