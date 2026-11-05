import { expect } from 'chai';
import { isUserDataRequest } from './user-data-bridge';

describe('isUserDataRequest', function () {
  it('accepts a request with and without a body', function () {
    expect(
      isUserDataRequest({ method: 'GET', url: 'compass-user-data://local/x' })
    ).to.equal(true);
    expect(
      isUserDataRequest({
        method: 'PUT',
        url: 'compass-user-data://local/x/1',
        body: '{}',
      })
    ).to.equal(true);
  });

  it('rejects values that are not plain string requests', function () {
    const rejected = [
      undefined,
      null,
      'GET',
      { method: 'GET' },
      { method: 1, url: 'u' },
      { method: 'PUT', url: 'u', body: { data: '' } },
    ].filter((value) => isUserDataRequest(value));

    expect(rejected).to.deep.equal([]);
  });
});
