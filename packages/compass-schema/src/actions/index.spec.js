import { expect } from 'chai';

import configureActions from './';

describe('#configureActions', function () {
  it('returns a new instance of the reflux actions', function () {
    expect(configureActions().startAnalysis).to.not.equal(undefined);
  });
});
