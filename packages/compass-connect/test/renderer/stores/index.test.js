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
      this.state.currentConnection.kerberos_principal = principal;
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
        expect(state.currentConnection.kerberos_principal).to.equal('testing');
        done();
      });
      ExtActions.onKerberosPrincipalChanged('testing');
    });
  });

  describe('#resetConnection', () => {
    context('when the form is currently valid', () => {
      before(() => {
        IndexStore.state.currentConnection.mongodb_username = 'testing';
      });

      it('updates the hostname in the current connection model', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.mongodb_username).to.equal(undefined);
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
          expect(state.currentConnection.ssl).to.equal('SYSTEMCA');
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

  describe('#onReplicaSetNameChanged', () => {
    it('updates the replica set name in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.replica_set_name).to.equal('myreplicaset');
        done();
      });
      Actions.onReplicaSetNameChanged('myreplicaset');
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.replica_set_name).to.equal('myreplicaset');
          done();
        });
        Actions.onReplicaSetNameChanged('myreplicaset  ');
      });
    });
  });

  describe('#onReadPreferenceChanged', () => {
    it('updates the read preference in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.read_preference).to.equal('primaryPreferred');
        done();
      });
      Actions.onReadPreferenceChanged('primaryPreferred');
    });
  });

  describe('#onSSHTunnelChanged', () => {
    it('updates the ssh method in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssh_tunnel).to.equal('IDENTITY_FILE');
        done();
      });
      Actions.onSSHTunnelChanged('IDENTITY_FILE');
    });

    context('when ssl attributes already exist', () => {
      beforeEach(() => {
        IndexStore.state.currentConnection.ssh_tunnel_hostname = 'host';
        IndexStore.state.currentConnection.ssh_tunnel_port = '3000';
        IndexStore.state.currentConnection.ssh_tunnel_bind_to_local_port = '5000';
        IndexStore.state.currentConnection.ssh_tunnel_username = 'user';
        IndexStore.state.currentConnection.ssh_tunnel_password = 'pass';
        IndexStore.state.currentConnection.ssh_tunnel_passphrase = 'pp';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.ssh_tunnel).to.equal('IDENTITY_FILE');
          expect(state.currentConnection.ssh_tunnel_hostname).to.equal(undefined);
          expect(state.currentConnection.ssh_tunnel_port).to.equal(22);
          expect(state.currentConnection.ssh_tunnel_bind_to_local_port).to.equal(undefined);
          expect(state.currentConnection.ssh_tunnel_username).to.equal(undefined);
          expect(state.currentConnection.ssh_tunnel_password).to.equal(undefined);
          expect(state.currentConnection.ssh_tunnel_identity_file).to.equal(undefined);
          expect(state.currentConnection.ssh_tunnel_passphrase).to.equal(undefined);
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
        expect(state.currentConnection.ssl).to.equal('SYSTEMCA');
        done();
      });
      Actions.onSSLMethodChanged('SYSTEMCA');
    });

    context('when ssl attributes already exist', () => {
      beforeEach(() => {
        IndexStore.state.currentConnection.ssl_ca = ['ca'];
        IndexStore.state.currentConnection.ssl_certificate = ['cert'];
        IndexStore.state.currentConnection.ssl_private_key = ['key'];
        IndexStore.state.currentConnection.ssl_private_key_password = 'pass';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.ssl).to.equal('SYSTEMCA');
          expect(state.currentConnection.ssl_certificate).to.equal(undefined);
          expect(state.currentConnection.ssl_private_key).to.equal(undefined);
          expect(state.currentConnection.ssl_ca).to.equal(undefined);
          expect(state.currentConnection.ssl_private_key_password).to.equal(undefined);
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
        expect(state.currentConnection.authentication).to.equal('MONGODB');
        done();
      });
      Actions.onAuthenticationMethodChanged('MONGODB');
    });

    context('when auth attributes already exist', () => {
      beforeEach(() => {
        IndexStore.state.currentConnection.mongodb_username = 'user';
        IndexStore.state.currentConnection.mongodb_password = 'password';
        IndexStore.state.currentConnection.mongodb_database_name = 'foo';
        IndexStore.state.currentConnection.kerberos_principal = 'kerb';
        IndexStore.state.currentConnection.kerberos_password = 'pass';
        IndexStore.state.currentConnection.kerberos_service_name = 'kerb-service';
        IndexStore.state.currentConnection.x509_username = 'x5user';
        IndexStore.state.currentConnection.ldap_username = 'ldapuser';
        IndexStore.state.currentConnection.ldap_password = 'ldappass';
      });

      it('clears out all previous values', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.authentication).to.equal('MONGODB');
          expect(state.currentConnection.mongodb_username).to.equal(undefined);
          expect(state.currentConnection.mongodb_password).to.equal(undefined);
          expect(state.currentConnection.mongodn_database_name).to.equal(undefined);
          expect(state.currentConnection.kerberos_principal).to.equal(undefined);
          expect(state.currentConnection.kerberos_password).to.equal(undefined);
          expect(state.currentConnection.kerberos_service_name).to.equal(undefined);
          expect(state.currentConnection.x509_username).to.equal(undefined);
          expect(state.currentConnection.ldap_username).to.equal(undefined);
          expect(state.currentConnection.ldap_password).to.equal(undefined);
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
        expect(state.currentConnection.mongodb_username).to.equal('user');
        done();
      });
      Actions.onUsernameChanged('user');
    });
  });

  describe('#onPasswordChanged', () => {
    it('updates the password in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodb_password).to.equal('pass');
        done();
      });
      Actions.onPasswordChanged('pass');
    });
  });

  describe('#onAuthSourceChanged', () => {
    it('updates the auth source in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.mongodb_database_name).to.equal('database');
        done();
      });
      Actions.onAuthSourceChanged('database');
    });
  });

  describe('#onSSLCAChanged', () => {
    it('updates the ssl ca field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssl_ca).to.deep.equal(['file']);
        done();
      });
      Actions.onSSLCAChanged(['file']);
    });
  });

  describe('#onSSLCertificateChanged', () => {
    it('updates the ssl certificate field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssl_certificate).to.deep.equal(['file']);
        done();
      });
      Actions.onSSLCertificateChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyChanged', () => {
    it('updates the ssl private key field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssl_private_key).to.deep.equal(['file']);
        done();
      });
      Actions.onSSLPrivateKeyChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyPasswordChanged', () => {
    it('updates the ssl private key password field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssl_private_key_password).to.equal('testing');
        done();
      });
      Actions.onSSLPrivateKeyPasswordChanged('testing');
    });
  });

  describe('#onSSHTunnelPortChanged', () => {
    it('updates the SSH Tunnel port in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssh_tunnel_port).to.equal('5000');
        done();
      });
      Actions.onSSHTunnelPortChanged('5000');
    });
  });

  describe('#onSSHTunnelUsernameChanged', () => {
    it('updates the SSH Tunnel username in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssh_tunnel_username).to.equal('mongodb');
        done();
      });
      Actions.onSSHTunnelUsernameChanged('mongodb');
    });
  });

  describe('#onSSHTunnelHostnameChanged', () => {
    it('updates the SSH Tunnel hostname in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssh_tunnel_hostname).to.equal('localhost');
        done();
      });
      Actions.onSSHTunnelHostnameChanged('localhost');
    });
  });

  describe('#onSSHTunnelPasswordChanged', () => {
    it('updates the SSH Tunnel password in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssh_tunnel_password).to.equal('mongodb');
        done();
      });
      Actions.onSSHTunnelPasswordChanged('mongodb');
    });
  });

  describe('#onSSHTunnelPassphraseChanged', () => {
    it('updates the SSH Tunnel passphrase in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssh_tunnel_passphrase).to.equal('mongodb');
        done();
      });
      Actions.onSSHTunnelPassphraseChanged('mongodb');
    });
  });

  describe('#onSSHTunnelIdentityFileChanged', () => {
    it('updates the SSH Tunnel identity file in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.ssh_tunnel_identity_file).to.deep.equal(['file']);
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
        expect(state.currentConnection.is_favorite).to.equal(true);
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
          expect(state.currentConnection.is_favorite).to.equal(false);
          expect(state.currentConnection.last_used).to.not.equal(undefined);
          expect(state.connections.length).to.equal(1);
          done();
        });
        Actions.onCreateRecent();
      });
    });

    context('when the list has 10 recent connections', () => {
      before(() => {
        IndexStore.state.connections.add(new Connection({ is_favorite: true }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-01') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-02') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-03') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-04') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-08') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-09') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-10') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-05') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-06') }));
        IndexStore.state.connections.add(new Connection({ last_used: new Date('2017-01-07') }));
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
          expect(state.currentConnection.is_favorite).to.equal(false);
          expect(state.currentConnection.last_used).to.not.equal(undefined);
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
          IndexStore.state.currentConnection.authentication = 'MONGODB';
          IndexStore.state.currentConnection.mongodb_database_name = '';
          IndexStore.updateDefaults();
        });

        afterEach(() => {
          IndexStore.state.currentConnection = new Connection();
        });

        it('sets the database name to admin', () => {
          expect(IndexStore.state.currentConnection.mongodb_database_name).to.equal('admin');
        });
      });
    });

    context('when auth is kerberos', () => {
      context('when the service name is empty', () => {
        before(() => {
          IndexStore.state.currentConnection.authentication = 'KERBEROS';
          IndexStore.updateDefaults();
        });

        after(() => {
          IndexStore.state.currentConnection = new Connection();
        });

        it('sets the service name to mongodb', () => {
          expect(IndexStore.state.currentConnection.kerberos_service_name).to.equal('mongodb');
        });
      });
    });
  });
});
