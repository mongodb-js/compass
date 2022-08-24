import { expect } from 'chai';

import reducer, { INITIAL_STATE } from './sort-order';
import { ActionTypes as IndexesActionTypes } from './indexes';

describe('sort order reducer', function () {
  it('when action is provided', function () {
    expect(
      reducer('desc', {
        type: IndexesActionTypes.SortIndexes,
        order: 'asc'
      })
    ).to.equal('asc');

    expect(
      reducer('asc', {
        type: IndexesActionTypes.SortIndexes,
        order: 'desc'
      })
    ).to.equal('desc');

    expect(
      reducer(undefined, {
        type: IndexesActionTypes.SortIndexes,
        order: 'desc'
      })
    ).to.equal('desc');
  });

  it('when action is not provided, it returns the default state', function () {
    expect(reducer(undefined, {} as any)).to.equal(INITIAL_STATE);
  });
});
