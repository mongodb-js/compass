const { expect } = require('chai');
const Connection = require('../../lib/models/connection');

describe('Connection', () => {
  describe('#new', () => {
    const date = new Date();
    const connection = new Connection({
      last_used: date
    });

    it('adds an _id field to the model', () => {
      expect(connection._id).to.not.equal(null);
    });

    it('adds a last_used field to the model', () => {
      expect(connection.last_used).to.deep.equal(date);
    });

    it('adds an is_favorite field to the model', () => {
      expect(connection.is_favorite).to.equal(false);
    });
  });

  describe('#username', () => {
    context('when there is no auth', () => {

    });

    context('when auth is MONGODB', () => {

    });

    context('when auth is KERBEROS', () => {

    });

    context('when auth is X509', () => {

    });

    context('when auth is LDAP', () => {

    });
  });
});
