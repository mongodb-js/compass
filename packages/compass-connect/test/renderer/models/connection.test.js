const { expect } = require('chai');
const Connection = require('../../../lib/models/connection');

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

    it('sets the correct app_name', () => {
      expect(connection.app_name).to.equal('Electron');
    });
  });

  describe('#username', () => {
    context('when there is no auth', () => {
      const connection = new Connection();

      it('returns an empty string', () => {
        expect(connection.username).to.equal('');
      });
    });

    context('when auth is MONGODB', () => {
      const connection = new Connection({
        authentication: 'MONGODB',
        mongodb_username: 'testing'
      });

      it('returns the mongodb_username', () => {
        expect(connection.username).to.equal('testing');
      });
    });

    context('when auth is KERBEROS', () => {
      const connection = new Connection({
        authentication: 'KERBEROS',
        kerberos_principal: 'testing'
      });

      it('returns the kerberos_principal', () => {
        expect(connection.username).to.equal('testing');
      });
    });

    context('when auth is X509', () => {
      const connection = new Connection({
        authentication: 'X509',
        x509_username: 'testing'
      });

      it('returns the x509_username', () => {
        expect(connection.username).to.equal('testing');
      });
    });

    context('when auth is LDAP', () => {
      const connection = new Connection({
        authentication: 'LDAP',
        ldap_username: 'testing'
      });

      it('returns the ldap_username', () => {
        expect(connection.username).to.equal('testing');
      });
    });
  });

  describe('.from', () => {
    const uri = 'mongodb://user:pass@127.0.0.1:27018/db?authSource=test';
    const connection = Connection.from(uri);

    it('returns the subclassed connection model', () => {
      expect(connection.username).to.equal('user');
    });
  });
});
