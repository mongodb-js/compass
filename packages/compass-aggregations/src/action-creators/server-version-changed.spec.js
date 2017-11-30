import { serverVersionChanged, SERVER_VERSION_CHANGED } from 'action-creators';

describe('#serverVersionChanged', () => {
  it('returns the SERVER_VERSION_CHANGED action', () => {
    expect(serverVersionChanged('3.0.0')).to.deep.equal({
      type: SERVER_VERSION_CHANGED,
      version: '3.0.0'
    });
  });
});
