import configureActions from 'actions';

describe('#configureActions', () => {
  it('returns a new instance of the reflux actions', () => {
    expect(configureActions().startSampling).to.not.equal(undefined);
  });
});
