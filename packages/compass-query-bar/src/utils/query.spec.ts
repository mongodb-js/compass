import { expect } from 'chai';

import {
  doesQueryHaveExtraOptionsSet,
  formatQueryValueForEditor,
  mapQueryToFormFields,
} from './query';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';

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
  });
});
