const { expect } = require('chai');
const Reflux = require('reflux');
const AppRegistry = require('hadron-app-registry');
const Connection = require('../../../lib/models/connection');
const Actions = require('../../../lib/actions');
const IndexStore = require('../../../lib/stores');

describe('IndexStore', function() {
  this.timeout(60000);

  afterEach(() => {
    IndexStore.state = IndexStore.getInitialState();
  });

  describe('#getInitialState', () => {
    it('initializes with an empty current connection', () => {
      expect(IndexStore.state.currentConnection.username).to.equal('');
    });
  });

  describe('#onActivated', () => {
    const ExtActions = Reflux.createActions([
      'onKerberosPrincipalChanged'
    ]);
    const onKerberosPrincipalChanged = function(principal) {
      this.state.currentConnection.kerberosPrincipal = principal;
      this.trigger(this.state);
    };
    const extension = function(store) {
      const principal = onKerberosPrincipalChanged.bind(store);
      ExtActions.onKerberosPrincipalChanged.listen(principal);
    };

    before(() => {
      const registry = new AppRegistry();

      registry.registerRole(IndexStore.EXTENSION, extension);
      IndexStore.onActivated(registry);
    });

    it('binds the store context to the extension', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.kerberosPrincipal).to.equal('testing');
        done();
      });

      ExtActions.onKerberosPrincipalChanged('testing');
    });
  });

  describe('#resetConnection', () => {
    context('when the form is currently valid', () => {
      before(() => {
        IndexStore.state.currentConnection.mongodbUsername = 'testing';
      });

      it('updates the hostname in the current connection model', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.mongodbUsername).to.equal(undefined);
          done();
        });

        Actions.resetConnection();
      });
    });

    context('when the form is not valid', () => {
      before(() => {
        IndexStore.state.isValid = false;
      });

      it('resets the form to valid', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.isValid).to.equal(true);
          done();
        });

        Actions.resetConnection();
      });
    });
  });

  describe('#onHostnameChanged', () => {
    it('updates the hostname in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.hostname).to.equal('myserver');
        done();
      });

      Actions.onHostnameChanged('myserver');
    });

    context('when the hostname contains mongodb.net', () => {
      it('updates the hostname and sets the systemca ssl option', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.hostname).to.equal('mongodb.net');
          expect(state.currentConnection.sslMethod).to.equal('SYSTEMCA');
          done();
        });

        Actions.onHostnameChanged('mongodb.net');
      });
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.hostname).to.equal('example.com');
          done();
        });

        Actions.onHostnameChanged('example.com  ');
      });
    });
  });

  describe('#onSRVRecordToggle', () => {
    afterEach(() => {
      IndexStore.state.currentConnection.isSrvRecord = false;
    });

    it('updates the srv record property', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.isSrvRecord).to.equal(true);
        done();
      });
      Actions.onSRVRecordToggle();
    });
  });

  describe('#onPortChanged', () => {
    it('updates the port in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.port).to.equal('27018');
        done();
      });

      Actions.onPortChanged('27018');
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.port).to.equal('27018');
          done();
        });

        Actions.onPortChanged('27018  ');
      });
    });
  });

  describe('#onReplicaSetChanged', () => {
    it('updates the replica set name in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.replicaSet).to.equal('myreplicaset');
        done();
      });

      Actions.onReplicaSetChanged('myreplicaset');
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.replicaSet).to.equal('myreplicaset');
          done();
        });

        Actions.onReplicaSetChanged('myreplicaset  ');
      });
    });
  });

  describe('#onReadPreferenceChanged', () => {
    it('updates the read preference in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.readPreference).to.equal('primaryPreferred');
        done();
      });

      Actions.onReadPreferenceChanged('primaryPreferred');
    });
  });

  describe('#onSSHTunnelChanged', () => {
    it('updates the ssh method in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnel).to.equal('IDENTITY_FILE');
        done();
      });

      Actions.onSSHTunnelChanged('IDENTITY_FILE');
    });

    context('when ssl attributes already exist', () => {
      beforeEach(() => {
        IndexStore.state.currentConnection.sshTunnelHostname = 'host';
        IndexStore.state.currentConnection.sshTunnelPort = '3000';
        IndexStore.state.currentConnection.sshTunnelBindToLocalPort = '5000';
        IndexStore.state.currentConnection.sshTunnelUsername = 'user';
        IndexStore.state.currentConnection.sshTunnelPassword = 'pass';
        IndexStore.state.currentConnection.sshTunnelPassphrase = 'pp';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.sshTunnel).to.equal('IDENTITY_FILE');
          expect(state.currentConnection.sshTunnelHostname).to.equal(undefined);
          expect(state.currentConnection.sshTunnelPort).to.equal(22);
          expect(state.currentConnection.sshTunnelBindToLocalPort).to.equal(undefined);
          expect(state.currentConnection.sshTunnelUsername).to.equal(undefined);
          expect(state.currentConnection.sshTunnelPassword).to.equal(undefined);
          expect(state.currentConnection.sshTunnelIdentityFile).to.equal(undefined);
          expect(state.currentConnection.sshTunnelPassphrase).to.equal(undefined);
          done();
        });

        Actions.onSSHTunnelChanged('IDENTITY_FILE');
      });
    });
  });

  describe('#onSSLMethodChanged', () => {
    it('updates the ssl method in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslMethod).to.equal('SYSTEMCA');
        done();
      });

      Actions.onSSLMethodChanged('SYSTEMCA');
    });

    context('when ssl attributes already exist', () => {
      beforeEach(() => {
        IndexStore.state.currentConnection.sslCA = ['ca'];
        IndexStore.state.currentConnection.sslCert = ['cert'];
        IndexStore.state.currentConnection.sslKey = ['key'];
        IndexStore.state.currentConnection.sslPass = 'pass';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.sslMethod).to.equal('SYSTEMCA');
          expect(state.currentConnection.sslCert).to.equal(undefined);
          expect(state.currentConnection.sslKey).to.equal(undefined);
          expect(state.currentConnection.sslCA).to.equal(undefined);
          expect(state.currentConnection.sslPass).to.equal(undefined);
          done();
        });

        Actions.onSSLMethodChanged('SYSTEMCA');
      });
    });
  });

  describe('#onAuthenticationMethodChanged', () => {
    it('updates the authentication method in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.authStrategy).to.equal('MONGODB');
        done();
      });

      Actions.onAuthenticationMethodChanged('MONGODB');
    });

    context('when auth attributes already exist', () => {
      beforeEach(() => {
        IndexStore.state.currentConnection.mongodbUsername = 'user';
        IndexStore.state.currentConnection.mongodbPassword = 'password';
        IndexStore.state.currentConnection.mongodbDatabaseName = 'foo';
        IndexStore.state.currentConnection.kerberosPrincipal = 'kerb';
        IndexStore.state.currentConnection.kerberosPassword = 'pass';
        IndexStore.state.currentConnection.kerberosServiceName = 'kerb-service';
        IndexStore.state.currentConnection.x509Username = 'x5user';
        IndexStore.state.currentConnection.ldapUsername = 'ldapuser';
        IndexStore.state.currentConnection.ldapPassword = 'ldappass';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.authStrategy).to.equal('MONGODB');
          expect(state.currentConnection.mongodbUsername).to.equal(undefined);
          expect(state.currentConnection.mongodbPassword).to.equal(undefined);
          expect(state.currentConnection.mongodbDatabaseName).to.equal(undefined);
          expect(state.currentConnection.kerberosPrincipal).to.equal(undefined);
          expect(state.currentConnection.kerberosPassword).to.equal(undefined);
          expect(state.currentConnection.kerberosServiceName).to.equal(undefined);
          expect(state.currentConnection.x509Username).to.equal(undefined);
          expect(state.currentConnection.ldapUsername).to.equal(undefined);
          expect(state.currentConnection.ldapPassword).to.equal(undefined);
          done();
        });

        Actions.onAuthenticationMethodChanged('MONGODB');
      });
    });
  });

  describe('#onUsernameChanged', () => {
    it('updates the username in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodbUsername).to.equal('user');
        done();
      });

      Actions.onUsernameChanged('user');
    });
  });

  describe('#onPasswordChanged', () => {
    it('updates the password in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodbPassword).to.equal('pass');
        done();
      });

      Actions.onPasswordChanged('pass');
    });
  });

  describe('#onAuthSourceChanged', () => {
    it('updates the auth source in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodbDatabaseName).to.equal('database');
        done();
      });

      Actions.onAuthSourceChanged('database');
    });
  });

  describe('#onSSLCAChanged', () => {
    it('updates the ssl ca field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslCA).to.deep.equal(['file']);
        done();
      });

      Actions.onSSLCAChanged(['file']);
    });
  });

  describe('#onSSLCertificateChanged', () => {
    it('updates the ssl certificate field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslCert).to.deep.equal(['file']);
        done();
      });

      Actions.onSSLCertificateChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyChanged', () => {
    it('updates the ssl private key field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslKey).to.deep.equal(['file']);
        done();
      });

      Actions.onSSLPrivateKeyChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyPasswordChanged', () => {
    it('updates the ssl private key password field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslPass).to.equal('testing');
        done();
      });

      Actions.onSSLPrivateKeyPasswordChanged('testing');
    });
  });

  describe('#onSSHTunnelPortChanged', () => {
    it('updates the SSH Tunnel port in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelPort).to.equal('5000');
        done();
      });

      Actions.onSSHTunnelPortChanged('5000');
    });
  });

  describe('#onSSHTunnelUsernameChanged', () => {
    it('updates the SSH Tunnel username in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelUsername).to.equal('mongodb');
        done();
      });

      Actions.onSSHTunnelUsernameChanged('mongodb');
    });
  });

  describe('#onSSHTunnelHostnameChanged', () => {
    it('updates the SSH Tunnel hostname in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelHostname).to.equal('localhost');
        done();
      });

      Actions.onSSHTunnelHostnameChanged('localhost');
    });
  });

  describe('#onSSHTunnelPasswordChanged', () => {
    it('updates the SSH Tunnel password in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelPassword).to.equal('mongodb');
        done();
      });

      Actions.onSSHTunnelPasswordChanged('mongodb');
    });
  });

  describe('#onSSHTunnelPassphraseChanged', () => {
    it('updates the SSH Tunnel passphrase in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelPassphrase).to.equal('mongodb');
        done();
      });

      Actions.onSSHTunnelPassphraseChanged('mongodb');
    });
  });

  describe('#onSSHTunnelIdentityFileChanged', () => {
    it('updates the SSH Tunnel identity file in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelIdentityFile).to.deep.equal(['file']);
        done();
      });

      Actions.onSSHTunnelIdentityFileChanged(['file']);
    });
  });

  describe('#onConnectionSelected', () => {
    const connection = new Connection();

    it('sets the current connection in the store', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.equal(connection);
        expect(state.isValid).to.equal(true);
        expect(state.isConnected).to.equal(false);
        expect(state.errorMessage).to.equal(null);
        done();
      });

      Actions.onConnectionSelected(connection);
    });
  });

  describe('#onFavoriteNameChanged', () => {
    it('updates the name on the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.name).to.equal('myconnection');
        done();
      });

      Actions.onFavoriteNameChanged('myconnection');
    });
  });

  describe('#onCreateFavorite', () => {
    before(() => {
      IndexStore.state.currentConnection.name = 'myconnection';
    });

    after((done) => {
      const unsubscribe = IndexStore.listen(() => {
        unsubscribe();
        done();
      });

      IndexStore.onDeleteConnection(IndexStore.state.currentConnection);
    });

    it('creates a new favorite in the store', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.isFavorite).to.equal(true);
        expect(state.connections.length).to.equal(1);
        done();
      });

      Actions.onCreateFavorite();
    });
  });

  describe('#onCreateRecent', () => {
    context('when the list is under 10 recent connections', () => {
      after((done) => {
        const unsubscribe = IndexStore.listen(() => {
          unsubscribe();
          done();
        });

        IndexStore.onDeleteConnection(IndexStore.state.currentConnection);
      });

      it('creates a new recent in the store', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.isFavorite).to.equal(false);
          expect(state.currentConnection.lastUsed).to.not.equal(undefined);
          expect(state.connections.length).to.equal(1);
          done();
        });

        Actions.onCreateRecent();
      });
    });

    context('when the list has 10 recent connections', () => {
      before(() => {
        IndexStore.state.connections.add(new Connection({ isFavorite: true }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-01') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-02') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-03') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-04') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-08') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-09') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-10') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-05') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-06') }));
        IndexStore.state.connections.add(new Connection({ lastUsed: new Date('2017-01-07') }));
      });

      after((done) => {
        const unsubscribe = IndexStore.listen(() => {
          unsubscribe();
          IndexStore.state.connections.reset();
          done();
        });

        IndexStore.onDeleteConnection(IndexStore.state.currentConnection);
      });

      it('limits the recent connections to 10', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.isFavorite).to.equal(false);
          expect(state.currentConnection.lastUsed).to.not.equal(undefined);
          expect(state.connections.length).to.equal(11);
          done();
        });

        Actions.onCreateRecent();
      });
    });
  });

  describe('#updateDefaults', () => {
    context('when auth is mongodb', () => {
      context('when the database name is empty', () => {
        beforeEach(() => {
          IndexStore.state.currentConnection.authStrategy = 'MONGODB';
          IndexStore.state.currentConnection.mongodbDatabaseName = '';
          IndexStore.updateDefaults();
        });

        afterEach(() => {
          IndexStore.state.currentConnection = new Connection();
        });

        it('sets the database name to admin', () => {
          expect(IndexStore.state.currentConnection.mongodbDatabaseName).to.equal('admin');
        });
      });
    });

    context('when auth is kerberos', () => {
      context('when the service name is empty', () => {
        before(() => {
          IndexStore.state.currentConnection.authStrategy = 'KERBEROS';
          IndexStore.updateDefaults();
        });

        after(() => {
          IndexStore.state.currentConnection = new Connection();
        });

        it('sets the service name to mongodb', () => {
          expect(IndexStore.state.currentConnection.kerberosServiceName).to.equal('mongodb');
        });
      });
    });
  });
});
