import { expect } from 'chai';

describe('kerberos', function () {
  it('should be requirable', function () {
    expect(() => {
      require('kerberos');
    }).to.not.throw();
  });
});
