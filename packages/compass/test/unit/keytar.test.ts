import { expect } from 'chai';

describe('keytar', function () {
  it('should be requirable', function () {
    expect(() => {
      require('keytar');
    }).to.not.throw();
  });
});
