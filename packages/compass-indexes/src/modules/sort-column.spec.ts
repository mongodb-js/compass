import { expect } from 'chai';

import reducer, { INITIAL_STATE } from './sort-column';
import { ActionTypes as IndexesActionTypes } from './indexes';

describe('sort column reducer', function () {
  it('when action is provied with column', function () {
    expect(
      reducer(undefined, { type: IndexesActionTypes.SortIndexes, column: 'Size' })
    ).to.equal('Size');
    expect(
      reducer('Size', { type: IndexesActionTypes.SortIndexes, column: 'Type' })
    ).to.equal('Type');
    expect(
      reducer('Type', { type: IndexesActionTypes.SortIndexes, column: 'Usage' })
    ).to.equal('Usage');
  });
  it('when action is not provided, it returns default state', function () {
    expect(reducer(undefined, {} as any)).to.equal(INITIAL_STATE);
  });
});
