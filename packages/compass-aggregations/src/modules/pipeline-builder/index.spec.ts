import { expect } from 'chai';

import reducer from './index';

describe('pipeline-builder', function () {
  it('should return the default reducer value', function () {
    const state = reducer(undefined, { type: 'unknown-action' });
    expect(state.pipelineMode).to.equal('builder-ui');
  });
});
