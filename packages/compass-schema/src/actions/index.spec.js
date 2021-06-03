import configureActions from './';

describe('#configureActions', () => {
  it('returns a new instance of the reflux actions', () => {
    expect(configureActions().startAnalysis).to.not.equal(undefined);
  });
});
