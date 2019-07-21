import Reflux from 'reflux';
import AppRegistry from 'hadron-app-registry';
import Connection from 'mongodb-connection-model';
import Actions from 'actions';
import Store from 'stores';

describe('Store', () => {
  afterEach(() => {
    Store.state = Store.getInitialState();
  });

  describe('#getInitialState', () => {
    it('initializes with an empty current connection', () => {
      expect(Store.state.currentConnection.username).to.equal('');
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

      registry.registerRole(Store.EXTENSION, extension);
      Store.onActivated(registry);
    });

    it('binds the store context to the extension', (done) => {
      const unsubscribe = Store.listen((state) => {
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
        Store.state.currentConnection.mongodbUsername = 'testing';
      });

      it('updates the hostname in the current connection model', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.mongodbUsername).to.equal(undefined);
          done();
        });

        Actions.resetConnection();
      });
    });

    context('when the form is not valid', () => {
      before(() => {
        Store.state.isValid = false;
      });

      it('resets the form to valid', (done) => {
        const unsubscribe = Store.listen((state) => {
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
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.hostname).to.equal('myserver');
        done();
      });

      Actions.onHostnameChanged('myserver');
    });

    context('when the hostname contains mongodb.net', () => {
      it('updates the hostname and sets the systemca ssl option', (done) => {
        const unsubscribe = Store.listen((state) => {
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
        const unsubscribe = Store.listen((state) => {
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
      Store.state.currentConnection.isSrvRecord = false;
    });

    it('updates the srv record property', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.isSrvRecord).to.equal(true);
        done();
      });
      Actions.onSRVRecordToggle();
    });
  });

  describe('#onPortChanged', () => {
    it('updates the port in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.port).to.equal('27018');
        done();
      });

      Actions.onPortChanged('27018');
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = Store.listen((state) => {
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
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.replicaSet).to.equal('myreplicaset');
        done();
      });

      Actions.onReplicaSetChanged('myreplicaset');
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = Store.listen((state) => {
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
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.readPreference).to.equal('primaryPreferred');
        done();
      });

      Actions.onReadPreferenceChanged('primaryPreferred');
    });
  });

  describe('#onSSHTunnelChanged', () => {
    it('updates the ssh method in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnel).to.equal('IDENTITY_FILE');
        done();
      });

      Actions.onSSHTunnelChanged('IDENTITY_FILE');
    });

    context('when ssl attributes already exist', () => {
      beforeEach(() => {
        Store.state.currentConnection.sshTunnelHostname = 'host';
        Store.state.currentConnection.sshTunnelPort = '3000';
        Store.state.currentConnection.sshTunnelBindToLocalPort = '5000';
        Store.state.currentConnection.sshTunnelUsername = 'user';
        Store.state.currentConnection.sshTunnelPassword = 'pass';
        Store.state.currentConnection.sshTunnelPassphrase = 'pp';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = Store.listen((state) => {
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
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslMethod).to.equal('SYSTEMCA');
        done();
      });

      Actions.onSSLMethodChanged('SYSTEMCA');
    });

    context('when ssl attributes already exist', () => {
      beforeEach(() => {
        Store.state.currentConnection.sslCA = ['ca'];
        Store.state.currentConnection.sslCert = ['cert'];
        Store.state.currentConnection.sslKey = ['key'];
        Store.state.currentConnection.sslPass = 'pass';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = Store.listen((state) => {
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

  describe('#onAuthStrategyChanged', () => {
    it('updates the authentication method in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.authStrategy).to.equal('MONGODB');
        done();
      });

      Actions.onAuthStrategyChanged('MONGODB');
    });

    context('when auth attributes already exist', () => {
      beforeEach(() => {
        Store.state.currentConnection.mongodbUsername = 'user';
        Store.state.currentConnection.mongodbPassword = 'password';
        Store.state.currentConnection.mongodbDatabaseName = 'foo';
        Store.state.currentConnection.kerberosPrincipal = 'kerb';
        Store.state.currentConnection.kerberosPassword = 'pass';
        Store.state.currentConnection.kerberosServiceName = 'kerb-service';
        Store.state.currentConnection.x509Username = 'x5user';
        Store.state.currentConnection.ldapUsername = 'ldapuser';
        Store.state.currentConnection.ldapPassword = 'ldappass';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = Store.listen((state) => {
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

        Actions.onAuthStrategyChanged('MONGODB');
      });
    });
  });

  describe('#onUsernameChanged', () => {
    it('updates the username in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodbUsername).to.equal('user');
        done();
      });

      Actions.onUsernameChanged('user');
    });
  });

  describe('#onPasswordChanged', () => {
    it('updates the password in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodbPassword).to.equal('pass');
        done();
      });

      Actions.onPasswordChanged('pass');
    });
  });

  describe('#onAuthSourceChanged', () => {
    it('updates the auth source in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodbDatabaseName).to.equal('database');
        done();
      });

      Actions.onAuthSourceChanged('database');
    });
  });

  describe('#onSSLCAChanged', () => {
    it('updates the ssl ca field in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslCA).to.deep.equal(['file']);
        done();
      });

      Actions.onSSLCAChanged(['file']);
    });
  });

  describe('#onSSLCertificateChanged', () => {
    it('updates the ssl certificate field in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslCert).to.deep.equal(['file']);
        done();
      });

      Actions.onSSLCertificateChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyChanged', () => {
    it('updates the ssl private key field in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslKey).to.deep.equal(['file']);
        done();
      });

      Actions.onSSLPrivateKeyChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyPasswordChanged', () => {
    it('updates the ssl private key password field in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sslPass).to.equal('testing');
        done();
      });

      Actions.onSSLPrivateKeyPasswordChanged('testing');
    });
  });

  describe('#onSSHTunnelPortChanged', () => {
    it('updates the SSH Tunnel port in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelPort).to.equal('5000');
        done();
      });

      Actions.onSSHTunnelPortChanged('5000');
    });
  });

  describe('#onSSHTunnelUsernameChanged', () => {
    it('updates the SSH Tunnel username in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelUsername).to.equal('mongodb');
        done();
      });

      Actions.onSSHTunnelUsernameChanged('mongodb');
    });
  });

  describe('#onSSHTunnelHostnameChanged', () => {
    it('updates the SSH Tunnel hostname in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelHostname).to.equal('localhost');
        done();
      });

      Actions.onSSHTunnelHostnameChanged('localhost');
    });
  });

  describe('#onSSHTunnelPasswordChanged', () => {
    it('updates the SSH Tunnel password in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelPassword).to.equal('mongodb');
        done();
      });

      Actions.onSSHTunnelPasswordChanged('mongodb');
    });
  });

  describe('#onSSHTunnelPassphraseChanged', () => {
    it('updates the SSH Tunnel passphrase in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.sshTunnelPassphrase).to.equal('mongodb');
        done();
      });

      Actions.onSSHTunnelPassphraseChanged('mongodb');
    });
  });

  describe('#onSSHTunnelIdentityFileChanged', () => {
    it('updates the SSH Tunnel identity file in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
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
      const unsubscribe = Store.listen((state) => {
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
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.name).to.equal('myconnection');
        done();
      });

      Actions.onFavoriteNameChanged('myconnection');
    });
  });

  describe('#onCreateFavorite', () => {
    before(() => {
      Store.state.currentConnection.name = 'myconnection';
    });

    after((done) => {
      const unsubscribe = Store.listen(() => {
        unsubscribe();
        done();
      });

      Store.onDeleteConnection(Store.state.currentConnection);
    });

    it.only('creates a new favorite in the store', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.isFavorite).to.equal(true);
        expect(state.connections.length).to.equal(1);
        done();
      });

      Actions.onCreateFavorite();
    });
  });
});
