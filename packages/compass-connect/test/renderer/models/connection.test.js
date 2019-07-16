const { expect } = require('chai');
const Connection = require('../../../lib/models/connection');

describe('Connection', () => {
  describe('#new', () => {
    const date = new Date();
    const connection = new Connection({ lastUsed: date });

    it('adds an _id field to the model', () => {
      expect(connection._id).to.not.equal(null);
    });

    it('adds a lastUsed field to the model', () => {
      expect(connection.lastUsed).to.deep.equal(date);
    });

    it('adds an isFavorite field to the model', () => {
      expect(connection.isFavorite).to.equal(false);
    });

    it('sets the correct appname', () => {
      expect(connection.appname).to.equal('Electron');
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
        authStrategy: 'MONGODB',
        mongodbUsername: 'testing'
      });

      it('returns the mongodbUsername', () => {
        expect(connection.username).to.equal('testing');
      });
    });

    context('when auth is KERBEROS', () => {
      const connection = new Connection({
        authStrategy: 'KERBEROS',
        kerberosPrincipal: 'testing'
      });

      it('returns the kerberosPrincipal', () => {
        expect(connection.username).to.equal('testing');
      });
    });

    context('when auth is X509', () => {
      const connection = new Connection({
        authStrategy: 'X509',
        x509Username: 'testing'
      });

      it('returns the x509Username', () => {
        expect(connection.username).to.equal('testing');
      });
    });

    context('when auth is LDAP', () => {
      const connection = new Connection({
        authStrategy: 'LDAP',
        ldapUsername: 'testing'
      });

      it('returns the ldapUsername', () => {
        expect(connection.username).to.equal('testing');
      });
    });
  });

  describe('.from', () => {
    it('returns the subclassed connection model', (done) => {
      const uri = 'mongodb://user:pass@127.0.0.1:27018/db?authSource=test';

      Connection.from(uri, (error, connection) => {
        expect(error).to.not.exist;
        expect(connection.username).to.equal('user');
        done();
      });
    });
  });
});
