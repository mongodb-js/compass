import { expect } from 'chai';

import { doesQueryHaveExtraOptionsSet, mapQueryToFormFields } from './query';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';

describe('#doesQueryHaveExtraOptionsSet', function () {
  it('returns true when there is a non filter option, false otherwise', function () {
    const defaultFields = mapQueryToFormFields(DEFAULT_FIELD_VALUES);

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
