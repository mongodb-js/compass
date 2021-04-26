import { expect } from 'chai';
import { isFastFailureConnectionError } from './index';

class MongoNetworkError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = this.constructor.name;
  }
}
class MongoError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = this.constructor.name;
  }
}

describe('isFastFailureConnectionError', function() {
  it('returns true for ECONNREFUSED', function() {
    expect(isFastFailureConnectionError(new MongoNetworkError('ECONNREFUSED'))).to.equal(true);
  });

  it('returns true for ENOTFOUND', function() {
    expect(isFastFailureConnectionError(new MongoNetworkError('ENOTFOUND'))).to.equal(true);
  });

  it('returns true for ENETUNREACH', function() {
    expect(isFastFailureConnectionError(new MongoNetworkError('ENETUNREACH'))).to.equal(true);
  });

  it('returns true when an API version is reuqired', function() {
    expect(isFastFailureConnectionError(new MongoError('The apiVersion parameter is required'))).to.equal(true);
  });

  it('returns false for generic errors', function() {
    expect(isFastFailureConnectionError(new Error('could not connect'))).to.equal(false);
  });
});
