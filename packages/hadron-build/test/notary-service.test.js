const notary = require('../lib/notary-service');
const chai = require('chai');
const expect = chai.expect;

describe('notary-service', function() {
  const secret = 'A-------------Z';
  const now = '2017-01-12T21:18:31.384Z';

  it('should generate the right salt', function() {
    expect(notary.getSalt(secret)).to.equal('Z-------------A');
  });

  it('should generate the auth token', function() {
    const token = notary.generateAuthToken(secret, now);
    expect(token).to.be.a('string');
    expect(token).to.equal('039177c6856119edeb56823ec4efb8913d0d03852017-01-12T21:18:31.384Z');
  });
});
