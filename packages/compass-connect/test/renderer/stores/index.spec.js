import AppRegistry from 'hadron-app-registry';
import Connection, { ConnectionCollection } from 'mongodb-connection-model';
import Reflux from 'reflux';

import Actions from '../../../src/actions';
import Store from '../../../src/stores';

describe('Store', () => {
  beforeEach(() => {
    Store.state = Store.getInitialState();
  });

  describe('#getInitialState', () => {
    it('initializes with an empty current connection', () => {
      expect(Store.state.currentConnection).to.exist;
      expect(Store.state.currentConnection.username).to.equal('');
      expect(Store.state.currentConnection.hostname).to.equal('localhost');
      expect(Store.state.currentConnection.port).to.equal(27017);
      expect(Store.state.currentConnection.connectionType).to.equal(
        'NODE_DRIVER'
      );
    });
  });

  describe('#onActivated', () => {
    const ExtActions = Reflux.createActions(['onKerberosPrincipalChanged']);
    const onKerberosPrincipalChanged = function(principal) {
      this.state.currentConnection.kerberosPrincipal = principal;
      this.trigger(this.state);
    };
    const extension = function(store) {
      const principal = onKerberosPrincipalChanged.bind(store);

      ExtActions.onKerberosPrincipalChanged.listen(principal);
    };

    beforeEach(() => {
      const registry = new AppRegistry();

      registry.registerRole(Store.EXTENSION, extension);
      Store.onActivated(registry);
    });

    it('binds the store context to the extension', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.kerberosPrincipal).to.equal('testing');
        done();
      });

      ExtActions.onKerberosPrincipalChanged('testing');
    });
  });

  describe('#onResetConnectionClicked', () => {
    context('when the form is currently valid', () => {
      const connection = new Connection({ mongodbUsername: 'testing' });

      beforeEach(() => {
        Store.state.currentConnection = connection;
        Store.state.isURIEditable = false;
      });

      it('updates the hostname and id in the current connection model', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.currentConnection).to.exist;
          expect(state.currentConnection.mongodbUsername).to.equal(undefined);
          expect(state.currentConnection._id).to.not.equal(connection._id);
          expect(state.isURIEditable).to.equal(true);
          done();
        });

        Actions.onResetConnectionClicked();
      });
    });

    context('when the form is not valid', () => {
      beforeEach(() => {
        Store.state.isValid = false;
      });

      it('resets the form to valid', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.isValid).to.equal(true);
          done();
        });

        Actions.onResetConnectionClicked();
      });
    });
  });

  describe('#validateConnectionString', () => {
    context('when the form is currently valid', () => {
      context('when entered a valid connection string', () => {
        beforeEach(() => {
          Store.state.customUrl = 'mongodb://server.example.com/';
          Store.state.isValid = true;
          Store.state.errorMessage = null;
          Store.state.syntaxErrorMessage = null;
        });

        it('does not change validation properties', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.isValid).to.equal(true);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.validateConnectionString();
        });
      });

      context('when entered a connection string with invalid schema', () => {
        beforeEach(() => {
          Store.state.customUrl = 'fake';
          Store.state.isValid = true;
          Store.state.errorMessage = null;
          Store.state.syntaxErrorMessage = null;
        });

        it('sets a syntax error message', (done) => {
          const syntaxErrorMessage =
            'Invalid schema, expected `mongodb` or `mongodb+srv`';
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.isValid).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(syntaxErrorMessage);
            done();
          });

          Actions.validateConnectionString();
        });
      });

      context('when entered an invalid connection string', () => {
        beforeEach(() => {
          Store.state.customUrl = 'mongodb://localhost/?compressors=bunnies';
          Store.state.isValid = true;
          Store.state.errorMessage = null;
          Store.state.syntaxErrorMessage = null;
        });

        it('sets a syntax error message', (done) => {
          const syntaxErrorMessage =
            'Value for `compressors` must be at least one of: `snappy`, `zlib`';
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.isValid).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(syntaxErrorMessage);
            done();
          });

          Actions.validateConnectionString();
        });
      });
    });

    context('when the form has a syntax error', () => {
      context('when entered a valid connection string', () => {
        beforeEach(() => {
          Store.state.customUrl = 'mongodb://server.example.com/';
          Store.state.isValid = false;
          Store.state.errorMessage = null;
          Store.state.syntaxErrorMessage = 'Some syntax error';
        });

        it('clears a syntax error message', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.isValid).to.equal(true);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.validateConnectionString();
        });
      });

      context('when entered an invalid connection string', () => {
        beforeEach(() => {
          Store.state.customUrl = 'another fake';
          Store.state.isValid = false;
          Store.state.errorMessage = null;
          Store.state.syntaxErrorMessage = 'Some syntax error';
        });

        it('clears a syntax error message', (done) => {
          const syntaxErrorMessage =
            'Invalid schema, expected `mongodb` or `mongodb+srv`';
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.isValid).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(syntaxErrorMessage);
            done();
          });

          Actions.validateConnectionString();
        });
      });

      context('when entered an empty string', () => {
        beforeEach(() => {
          Store.state.customUrl = '';
          Store.state.isValid = false;
          Store.state.errorMessage = null;
          Store.state.syntaxErrorMessage = 'Some syntax error';
        });

        it('clears a syntax error message', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.isValid).to.equal(true);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.validateConnectionString();
        });
      });
    });
  });

  describe('#onHostnameChanged', () => {
    it('updates the hostname in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.hostname).to.equal('myserver');
        done();
      });

      Actions.onHostnameChanged('myserver');
    });

    context('when the hostname contains mongodb.net', () => {
      it('updates the hostname and sets the systemca ssl option', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.currentConnection).to.exist;
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
          expect(state.currentConnection).to.exist;
          expect(state.currentConnection.hostname).to.equal('example.com');
          done();
        });

        Actions.onHostnameChanged('example.com  ');
      });
    });
  });

  describe('#onSRVRecordToggled', () => {
    afterEach(() => {
      Store.state.currentConnection.isSrvRecord = false;
    });

    it('updates the srv record property', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.isSrvRecord).to.equal(true);
        done();
      });
      Actions.onSRVRecordToggled();
    });
  });

  describe('#onPortChanged', () => {
    it('updates the port in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.port).to.equal('27018');
        done();
      });

      Actions.onPortChanged('27018');
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.replicaSet).to.equal('myreplicaset');
        done();
      });

      Actions.onReplicaSetChanged('myreplicaset');
    });

    context('when it contains trailing spaces', () => {
      it('trims the whitespace', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.readPreference).to.equal(
          'primaryPreferred'
        );
        done();
      });

      Actions.onReadPreferenceChanged('primaryPreferred');
    });
  });

  describe('#onSSHTunnelChanged', () => {
    it('updates the ssh method in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.exist;
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
          expect(state.currentConnection).to.exist;
          expect(state.currentConnection.sshTunnel).to.equal('IDENTITY_FILE');
          expect(state.currentConnection.sshTunnelHostname).to.equal(undefined);
          expect(state.currentConnection.sshTunnelPort).to.equal(22);
          expect(state.currentConnection.sshTunnelBindToLocalPort).to.equal(
            undefined
          );
          expect(state.currentConnection.sshTunnelUsername).to.equal(undefined);
          expect(state.currentConnection.sshTunnelPassword).to.equal(undefined);
          expect(state.currentConnection.sshTunnelIdentityFile).to.equal(
            undefined
          );
          expect(state.currentConnection.sshTunnelPassphrase).to.equal(
            undefined
          );
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
        expect(state.currentConnection).to.exist;
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
          expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
          expect(state.currentConnection).to.exist;
          expect(state.currentConnection.authStrategy).to.equal('MONGODB');
          expect(state.currentConnection.mongodbUsername).to.equal(undefined);
          expect(state.currentConnection.mongodbPassword).to.equal(undefined);
          expect(state.currentConnection.mongodbDatabaseName).to.equal(
            undefined
          );
          expect(state.currentConnection.kerberosPrincipal).to.equal(undefined);
          expect(state.currentConnection.kerberosPassword).to.equal(undefined);
          expect(state.currentConnection.kerberosServiceName).to.equal(
            undefined
          );
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.mongodbDatabaseName).to.equal(
          'database'
        );
        done();
      });

      Actions.onAuthSourceChanged('database');
    });
  });

  describe('#onSSLCAChanged', () => {
    it('updates the ssl ca field in the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
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
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.sshTunnelIdentityFile).to.deep.equal([
          'file'
        ]);
        done();
      });

      Actions.onSSHTunnelIdentityFileChanged(['file']);
    });
  });

  describe('#onConnectionSelected', () => {
    context('when the current connection ia a new connection', () => {
      context('when a favorite is being selected', () => {
        const currentConnection = new Connection();
        const favoriteConnection = new Connection({
          name: 'MyFav',
          color: '#59c1e2',
          port: '11111',
          isFavorite: true
        });
        const favorite = favoriteConnection.getAttributes({
          props: true,
          derived: true
        });

        beforeEach(() => {
          Store.state.currentConnection = currentConnection;
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(favoriteConnection);
          Store.state.connections = { [favorite._id]: favorite };
        });

        it('sets the current connection in the store', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection._id).to.equal(
              favoriteConnection._id
            );
            expect(state.currentConnection.color).to.equal(
              favoriteConnection.color
            );
            expect(state.currentConnection.name).to.equal(
              favoriteConnection.name
            );
            expect(state.currentConnection.port).to.equal(
              favoriteConnection.port
            );
            expect(state.currentConnection.isFavorite).to.equal(true);
            expect(state.isValid).to.equal(true);
            expect(state.isConnected).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.onConnectionSelected(favorite);
        });
      });

      context('when a recent is being selected', () => {
        const currentConnection = new Connection();
        const recentConnection = new Connection({
          hostname: 'localhost',
          port: '11111',
          isFavorite: false
        });
        const favorite = recentConnection.getAttributes({
          props: true,
          derived: true
        });

        beforeEach(() => {
          Store.state.currentConnection = currentConnection;
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(recentConnection);
          Store.state.connections = { [favorite._id]: favorite };
        });

        it('sets the current connection in the store', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection._id).to.equal(recentConnection._id);
            expect(state.currentConnection.color).to.equal(undefined);
            expect(state.currentConnection.name).to.equal('Local');
            expect(state.currentConnection.port).to.equal(
              recentConnection.port
            );
            expect(state.currentConnection.isFavorite).to.equal(false);
            expect(state.isValid).to.equal(true);
            expect(state.isConnected).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.onConnectionSelected(favorite);
        });
      });
    });

    context('when the current connection ia a favorite connection', () => {
      context('when a favorite is being selected', () => {
        const currentFavConnection = new Connection({
          name: 'CurrentFavConnection',
          color: '#d66531',
          port: '11111',
          isFavorite: true
        });
        const newFavConnection = new Connection({
          name: 'NewFavConnection',
          color: '#59c1e2',
          port: '22222',
          isFavorite: true
        });
        const connections = {
          [currentFavConnection._id]: currentFavConnection.getAttributes({
            props: true,
            derived: true
          }),
          [newFavConnection._id]: newFavConnection.getAttributes({
            props: true,
            derived: true
          })
        };

        beforeEach(() => {
          Store.state.currentConnection = currentFavConnection;
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(currentFavConnection);
          Store.state.fetchedConnections.add(newFavConnection);
          Store.state.connections = connections;
        });

        it('sets the current connection in the store', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection._id).to.equal(newFavConnection._id);
            expect(state.currentConnection.color).to.equal(
              newFavConnection.color
            );
            expect(state.currentConnection.name).to.equal(
              newFavConnection.name
            );
            expect(state.currentConnection.port).to.equal(
              newFavConnection.port
            );
            expect(state.currentConnection.isFavorite).to.equal(true);
            expect(state.isValid).to.equal(true);
            expect(state.isConnected).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.onConnectionSelected(connections[newFavConnection._id]);
        });
      });

      context('when a recent is being selected', () => {
        const currentFavConnection = new Connection({
          name: 'CurrentFavConnection',
          color: '#d66531',
          port: '11111',
          isFavorite: true
        });
        const recent = new Connection({
          hostname: 'recenthostname',
          port: '22222',
          isFavorite: false
        });
        const connections = {
          [currentFavConnection._id]: currentFavConnection.getAttributes({
            props: true,
            derived: true
          }),
          [recent._id]: recent.getAttributes({ props: true, derived: true })
        };

        beforeEach(() => {
          Store.state.currentConnection = currentFavConnection;
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(currentFavConnection);
          Store.state.fetchedConnections.add(recent);
          Store.state.connections = connections;
        });

        it('sets the current connection in the store', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection._id).to.equal(recent._id);
            expect(state.currentConnection.color).to.equal(undefined);
            expect(state.currentConnection.name).to.equal('Local');
            expect(state.currentConnection.hostname).to.equal(recent.hostname);
            expect(state.currentConnection.port).to.equal(recent.port);
            expect(state.currentConnection.isFavorite).to.equal(false);
            expect(state.isValid).to.equal(true);
            expect(state.isConnected).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.onConnectionSelected(connections[recent._id]);
        });
      });
    });

    context('when the current connection ia a recent connection', () => {
      context('when a favorite is being selected', () => {
        const currentRecent = new Connection({
          hostname: 'recentlocalhost',
          port: '11111',
          isFavorite: false
        });
        const newFavConnection = new Connection({
          name: 'NewFavConnection',
          color: '#59c1e2',
          port: '22222',
          isFavorite: true
        });
        const connections = {
          [currentRecent._id]: currentRecent.getAttributes({
            props: true,
            derived: true
          }),
          [newFavConnection._id]: newFavConnection.getAttributes({
            props: true,
            derived: true
          })
        };

        beforeEach(() => {
          Store.state.currentConnection = currentRecent;
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(currentRecent);
          Store.state.fetchedConnections.add(newFavConnection);
          Store.state.connections = connections;
        });

        it('sets the current connection in the store', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection._id).to.equal(newFavConnection._id);
            expect(state.currentConnection.color).to.equal(
              newFavConnection.color
            );
            expect(state.currentConnection.name).to.equal(
              newFavConnection.name
            );
            expect(state.currentConnection.port).to.equal(
              newFavConnection.port
            );
            expect(state.currentConnection.isFavorite).to.equal(true);
            expect(state.isValid).to.equal(true);
            expect(state.isConnected).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.onConnectionSelected(connections[newFavConnection._id]);
        });
      });

      context('when a recent is being selected', () => {
        const currentRecent = new Connection({
          hostname: 'recentlocalhost',
          port: '11111',
          isFavorite: false
        });
        const newRecent = new Connection({
          hostname: 'newrecentlocalhost',
          port: '22222',
          isFavorite: false
        });
        const connections = {
          [currentRecent._id]: currentRecent.getAttributes({
            props: true,
            derived: true
          }),
          [newRecent._id]: newRecent.getAttributes({
            props: true,
            derived: true
          })
        };

        beforeEach(() => {
          Store.state.currentConnection = currentRecent;
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(currentRecent);
          Store.state.fetchedConnections.add(newRecent);
          Store.state.connections = connections;
        });

        it('sets the current connection in the store', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection._id).to.equal(newRecent._id);
            expect(state.currentConnection.color).to.equal(undefined);
            expect(state.currentConnection.name).to.equal('Local');
            expect(state.currentConnection.hostname).to.equal(
              newRecent.hostname
            );
            expect(state.currentConnection.port).to.equal(newRecent.port);
            expect(state.currentConnection.isFavorite).to.equal(false);
            expect(state.isValid).to.equal(true);
            expect(state.isConnected).to.equal(false);
            expect(state.errorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            expect(state.syntaxErrorMessage).to.equal(null);
            done();
          });

          Actions.onConnectionSelected(connections[newRecent._id]);
        });
      });
    });
  });

  describe('#onConnectionFormChanged', () => {
    beforeEach(() => {
      Store.state.syntaxErrorMessage = 'Some syntax error';
    });

    it('removes errors from the store', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isValid).to.equal(true);
        expect(state.errorMessage).to.equal(null);
        expect(state.syntaxErrorMessage).to.equal(null);
        done();
      });

      Actions.onConnectionFormChanged();
    });
  });

  describe('#onCustomUrlChanged', () => {
    const customUrl = 'mongodb://localhost/';

    beforeEach(() => {
      Store.state.customUrl = '';
    });

    it('removes errors from the store', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.customUrl).to.equal(customUrl);
        done();
      });

      Actions.onCustomUrlChanged(customUrl);
    });
  });

  describe('#onChangeViewClicked', () => {
    context('when a form is valid', () => {
      context('when a current viewType is connectionString', () => {
        context('when a current connection string is valid', () => {
          context('when a connection string is editable', () => {
            const connection = new Connection();

            beforeEach(() => {
              Store.state.isValid = true;
              Store.state.viewType = 'connectionString';
              Store.state.customUrl = 'mongodb://server.example.com/';
              Store.StatusActions = {
                showIndeterminateProgressBar: () => {},
                done: () => {}
              };
              Store.state.currentConnection = connection;
              Store.state.isURIEditable = true;
            });

            it('sets the connectionForm viewType', (done) => {
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.viewType).to.equal('connectionForm');
                done();
              });

              Actions.onChangeViewClicked('connectionForm');
            });

            it('sets the driverUrl', (done) => {
              const driverUrl =
                'mongodb://server.example.com:27017/?readPreference=primary&ssl=false';
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.currentConnection).to.exist;
                expect(state.currentConnection.driverUrl).to.equal(driverUrl);
                done();
              });

              Actions.onChangeViewClicked('connectionForm');
            });

            it('keeps the current connection id', (done) => {
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.currentConnection).to.exist;
                expect(state.currentConnection._id).to.equal(connection._id);
                done();
              });

              Actions.onChangeViewClicked('connectionForm');
            });
          });

          context('when a connection string is not editable', () => {
            const connection = new Connection({
              hostname: 'server.example.com',
              port: 27017,
              authStrategy: 'MONGODB',
              mongodbUsername: 'user',
              mongodbPassword: 'password'
            });

            beforeEach(() => {
              Store.state.isValid = true;
              Store.state.viewType = 'connectionString';
              Store.state.customUrl =
                'mongodb://user:*****@server.example.com:27017/?authSource=admin&readPreference=primary&ssl=false';
              Store.state.driverUrl =
                'mongodb://user:password@server.example.com:27017/?authSource=admin&readPreference=primary&ssl=false';
              Store.StatusActions = {
                showIndeterminateProgressBar: () => {},
                done: () => {}
              };
              Store.state.currentConnection = connection;
              Store.state.isURIEditable = false;
            });

            it('sets the real password for the current connection', (done) => {
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.currentConnection).to.exist;
                expect(state.currentConnection.mongodbPassword).to.equal(
                  'password'
                );
                done();
              });

              Actions.onChangeViewClicked('connectionForm');
            });
          });
        });

        context('when a current connection string is invalid', () => {
          beforeEach(() => {
            Store.state.isValid = false;
            Store.state.viewType = 'connectionString';
            Store.state.customUrl = 'fake';
            Store.StatusActions = {
              showIndeterminateProgressBar: () => {},
              done: () => {}
            };
          });

          it('sets the connectionForm viewType', (done) => {
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.viewType).to.equal('connectionForm');
              done();
            });

            Actions.onChangeViewClicked('connectionForm');
          });

          it('cleans the driverUrl', (done) => {
            const driverUrl =
              'mongodb://localhost:27017/?readPreference=primary&ssl=false';
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.currentConnection).to.exist;
              expect(state.currentConnection.driverUrl).to.equal(driverUrl);
              expect(state.isValid).to.equal(false);
              expect(state.errorMessage).to.equal(null);
              done();
            });

            Actions.onChangeViewClicked('connectionForm');
          });
        });

        context('when a current connection string is empty', () => {
          beforeEach(() => {
            Store.state.isValid = true;
            Store.state.viewType = 'connectionString';
            Store.state.customUrl = '';
            Store.StatusActions = {
              showIndeterminateProgressBar: () => {},
              done: () => {}
            };
          });

          it('sets the connectionForm viewType', (done) => {
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.viewType).to.equal('connectionForm');
              done();
            });

            Actions.onChangeViewClicked('connectionForm');
          });

          it('does not change validation properties', (done) => {
            const driverUrl =
              'mongodb://localhost:27017/?readPreference=primary&ssl=false';
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.currentConnection).to.exist;
              expect(state.currentConnection.driverUrl).to.equal(driverUrl);
              expect(state.isValid).to.equal(true);
              expect(state.errorMessage).to.equal(null);
              expect(state.syntaxErrorMessage).to.equal(null);
              done();
            });

            Actions.onChangeViewClicked('connectionForm');
          });
        });
      });

      context('when a current viewType is connectionForm', () => {
        const connection = new Connection();

        context('when a current connection string is valid', () => {
          beforeEach(() => {
            Store.state.isValid = true;
            Store.state.viewType = 'connectionForm';
            Store.state.customUrl = 'mongodb://server.example.com/';
            Store.StatusActions = {
              showIndeterminateProgressBar: () => {},
              done: () => {}
            };
            Store.state.currentConnection = connection;
          });

          it('sets the connectionString viewType', (done) => {
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.viewType).to.equal('connectionString');
              done();
            });

            Actions.onChangeViewClicked('connectionString');
          });

          it('does not change validation properties', (done) => {
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.isValid).to.equal(true);
              expect(state.errorMessage).to.equal(null);
              expect(state.syntaxErrorMessage).to.equal(null);
              done();
            });

            Actions.onChangeViewClicked('connectionString');
          });

          it('keeps the current connection id', (done) => {
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.currentConnection).to.exist;
              expect(state.currentConnection._id).to.equal(connection._id);
              done();
            });

            Actions.onChangeViewClicked('connectionString');
          });
        });

        context('when a current connection string is invalid', () => {
          context('when a form was changed', () => {
            beforeEach(() => {
              Store.state.isValid = true;
              Store.state.viewType = 'connectionForm';
              Store.state.customUrl = 'fake';
              Store.state.currentConnection.hostname = 'test';
              Store.state.isHostChanged = true;
              Store.StatusActions = {
                showIndeterminateProgressBar: () => {},
                done: () => {}
              };
            });

            it('sets the connectionString viewType', (done) => {
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.viewType).to.equal('connectionString');
                done();
              });

              Actions.onChangeViewClicked('connectionString');
            });

            it('updates customUrl and cleans a syntax error', (done) => {
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.customUrl).to.equal(
                  'mongodb://test:27017/?readPreference=primary&ssl=false'
                );
                expect(state.errorMessage).to.equal(null);
                expect(state.syntaxErrorMessage).to.equal(null);
                done();
              });

              Actions.onChangeViewClicked('connectionString');
            });
          });

          context('when a form was not changed', () => {
            const syntaxErrorMessage =
              'Invalid schema, expected `mongodb` or `mongodb+srv`';

            beforeEach(() => {
              Store.state.isValid = false;
              Store.state.viewType = 'connectionString';
              Store.state.customUrl = 'fake';
              Store.state.syntaxErrorMessage = syntaxErrorMessage;
              Store.StatusActions = {
                showIndeterminateProgressBar: () => {},
                done: () => {}
              };
            });

            it('sets the connectionString viewType', (done) => {
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.viewType).to.equal('connectionString');
                done();
              });

              Actions.onChangeViewClicked('connectionString');
            });

            it('does not change validation properties', (done) => {
              const unsubscribe = Store.listen((state) => {
                unsubscribe();
                expect(state.isValid).to.equal(false);
                expect(state.errorMessage).to.equal(null);
                expect(state.syntaxErrorMessage).to.equal(syntaxErrorMessage);
                done();
              });

              Actions.onChangeViewClicked('connectionForm');
            });
          });
        });
      });
    });
  });

  describe('#onFavoriteNameChanged', () => {
    it('updates the name on the current connection model', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.name).to.equal('myconnection');
        done();
      });

      Actions.onFavoriteNameChanged('myconnection');
    });
  });

  describe('#onCreateFavoriteClicked', () => {
    beforeEach(() => {
      Store.state.currentConnection = new Connection({
        isFavorite: false,
        hostname: 'localhost',
        port: 27011
      });
      Store.state.viewType = 'connectionForm';
      Store.state.fetchedConnections = new ConnectionCollection();
      Store.state.connections = {};
    });

    it('creates a new favorite in the store', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();

        const currentId = state.currentConnection._id;

        expect(state.currentConnection).to.exist;
        expect(state.currentConnection.isFavorite).to.equal(true);
        expect(state.connections[currentId]._id).to.equal(currentId);
        done();
      });

      Actions.onCreateFavoriteClicked('myconnection', '#deb342');
    });
  });

  describe('#hideFavoriteMessage', () => {
    beforeEach(() => {
      Store.state.isMessageVisible = true;
    });

    it('hides the message about creating or updating a favorite', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isMessageVisible).to.equal(false);
        done();
      });

      Actions.hideFavoriteMessage();
    });
  });

  describe('#hideFavoriteModal', () => {
    beforeEach(() => {
      Store.state.isModalVisible = true;
    });

    it('hides the favorite modal', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isModalVisible).to.equal(false);
        done();
      });

      Actions.hideFavoriteModal();
    });
  });

  describe('#showFavoriteModal', () => {
    beforeEach(() => {
      Store.state.isModalVisible = false;
    });

    it('shows the favorite modal', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isModalVisible).to.equal(true);
        done();
      });

      Actions.showFavoriteModal();
    });
  });

  describe('#onDuplicateConnectionClicked', () => {
    context('when the current connection is being copied', () => {
      const connection = new Connection({
        hostname: 'localhost',
        port: 28017,
        name: 'MyConnection',
        color: '#d4366e'
      });
      const connections = {
        [connection._id]: connection.getAttributes({
          props: true,
          derived: true
        })
      };

      beforeEach(() => {
        Store.state.fetchedConnections = new ConnectionCollection();
        Store.state.fetchedConnections.add(connection);
        Store.state.connections = { ...connections };
        Store.state.currentConnection = connection;
      });

      it('selects a copy as current connection with new name and color', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.connections).to.exist;
          expect(state.currentConnection).to.exist;

          const copyId = Object.keys(state.connections).find(
            (key) => !Object.keys(connections).includes(key)
          );

          expect(Object.keys(state.connections).length).to.equal(2);
          expect(state.connections[copyId].name).to.equal(
            `${connection.name} (copy)`
          );
          expect(state.connections[copyId].color).to.equal(undefined);
          expect(state.connections[copyId].isFavorite).to.equal(true);
          expect(state.connections[copyId]._id).to.not.equal(connection._id);
          expect(state.connections[copyId]._id).to.equal(
            state.currentConnection._id
          );
          done();
        });

        Actions.onDuplicateConnectionClicked(connection);
      });
    });

    context('when not a current connection is being copied', () => {
      const connectionToCopy = new Connection({
        hostname: 'localhost',
        port: 28017,
        name: 'ConnectionToCopy',
        color: '#3b8196'
      });
      const currentConnection = new Connection({
        hostname: 'localhost',
        port: 18017,
        name: 'CurrentConnection',
        color: '#d4366e'
      });
      const connections = {
        [connectionToCopy._id]: connectionToCopy.getAttributes({
          props: true,
          derived: true
        }),
        [currentConnection._id]: currentConnection.getAttributes({
          props: true,
          derived: true
        })
      };

      beforeEach(() => {
        Store.state.fetchedConnections = new ConnectionCollection();
        Store.state.fetchedConnections.add(connectionToCopy);
        Store.state.fetchedConnections.add(currentConnection);
        Store.state.connections = { ...connections };
        Store.state.currentConnection = currentConnection;
      });

      it('selects a copy as current connection with new name and color', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.connections).to.exist;
          expect(state.currentConnection).to.exist;

          const copyId = Object.keys(state.connections).find(
            (key) => !Object.keys(connections).includes(key)
          );

          expect(Object.keys(state.connections).length).to.equal(3);
          expect(state.connections[copyId].name).to.equal(
            `${connectionToCopy.name} (copy)`
          );
          expect(state.connections[copyId].name).to.not.equal(
            `${currentConnection.name} (copy)`
          );
          expect(state.connections[copyId].color).to.equal(undefined);
          expect(state.connections[copyId].isFavorite).to.equal(true);
          expect(state.connections[copyId]._id).to.not.equal(
            connectionToCopy._id
          );
          expect(state.connections[copyId]._id).to.not.equal(
            currentConnection._id
          );
          expect(state.connections[copyId]._id).to.equal(
            state.currentConnection._id
          );
          done();
        });

        Actions.onDuplicateConnectionClicked(connectionToCopy);
      });
    });
  });

  describe('#onChangesDiscarded', () => {
    context('when it is a connection string view', () => {
      context('when it is a favorite connection', () => {
        context('when a connection string is editable', () => {
          const favorite = new Connection({
            hostname: 'favorite.example.com',
            name: 'ConnectionToCopy',
            color: '#3b8196',
            isFavorite: true
          });
          const connections = {
            [favorite._id]: favorite.getAttributes({ props: true })
          };

          beforeEach(() => {
            Store.state.viewType = 'connectionString';
            Store.state.fetchedConnections = new ConnectionCollection();
            Store.state.fetchedConnections.add(favorite);
            Store.state.connections = { ...connections };
            Store.state.currentConnection = favorite.set({
              hostname: 'server.newexample.com'
            });
            Store.state.isURIEditable = true;
            Store.state.customUrl = 'mongodb://favorite.newexample.com/';
          });

          it('discards changes and shows the password', (done) => {
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.currentConnection).to.exist;

              const driverUrl =
                'mongodb://favorite.example.com:27017/?readPreference=primary&ssl=false';

              expect(state.currentConnection.hostname).to.equal(
                favorite.hostname
              );
              expect(state.customUrl).to.equal(driverUrl);
              done();
            });

            Actions.onChangesDiscarded();
          });
        });

        context('when a connection string is not editable', () => {
          const favorite = new Connection({
            hostname: 'favorite.example.com',
            port: 27001,
            authStrategy: 'MONGODB',
            mongodbUsername: 'user',
            mongodbPassword: 'password',
            name: 'ConnectionToCopy',
            color: '#3b8196',
            isFavorite: true
          });
          const connections = {
            [favorite._id]: favorite.getAttributes({ props: true })
          };

          beforeEach(() => {
            Store.state.viewType = 'connectionString';
            Store.state.fetchedConnections = new ConnectionCollection();
            Store.state.fetchedConnections.add(favorite);
            Store.state.connections = { ...connections };
            Store.state.currentConnection = favorite.set({
              hostname: 'server.newexample.com'
            });
            Store.state.isURIEditable = false;
            Store.state.customUrl =
              'mongodb://newuser:*****@favorite.example.com:27001/?authSource=admin&readPreference=primary&ssl=false';
          });

          it('discards changes and hides the password', (done) => {
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.currentConnection).to.exist;

              const driverUrl =
                'mongodb://user:*****@favorite.example.com:27001/?authSource=admin&readPreference=primary&ssl=false';

              expect(state.customUrl).to.equal(driverUrl);
              done();
            });

            Actions.onChangesDiscarded();
          });
        });
      });

      context('when it is a recent connection', () => {
        const recent = new Connection({
          hostname: 'server.example.com',
          port: 27001
        });
        const connections = {
          [recent._id]: recent.getAttributes({ props: true, derived: true })
        };

        beforeEach(() => {
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(recent);
          Store.state.connections = { ...connections };
          Store.state.currentConnection = recent.set({
            hostname: 'server.newexample.com'
          });
          Store.state.customUrl = 'mongodb://server.newexample.com/';
        });

        it('discards changes', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;

            const driverUrl =
              'mongodb://server.example.com:27001/?readPreference=primary&ssl=false';

            expect(state.currentConnection.hostname).to.equal(recent.hostname);
            expect(state.customUrl).to.equal(driverUrl);
            done();
          });

          Actions.onChangesDiscarded();
        });
      });
    });

    context('when it is a connection form view', () => {
      context('when it is a favorite connection', () => {
        const favorite = new Connection({
          hostname: 'server.example.com',
          port: '27001',
          name: 'ConnectionToCopy',
          color: '#3b8196',
          isFavorite: true
        });
        const connections = {
          [favorite._id]: favorite.getAttributes({ props: true, derived: true })
        };

        beforeEach(() => {
          Store.state.viewType = 'connectionForm';
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(favorite);
          Store.state.connections = { ...connections };
          Store.state.currentConnection = favorite.set({ port: 27002 });
        });

        it('discards changes', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection.port).to.equal(favorite.port);
            done();
          });

          Actions.onChangesDiscarded();
        });
      });

      context('when it is a recent connection', () => {
        const recent = new Connection({
          hostname: 'server.example.com',
          port: '27001'
        });
        const connections = {
          [recent._id]: recent.getAttributes({ props: true, derived: true })
        };

        beforeEach(() => {
          Store.state.viewType = 'connectionForm';
          Store.state.fetchedConnections = new ConnectionCollection();
          Store.state.fetchedConnections.add(recent);
          Store.state.connections = { ...connections };
          Store.state.currentConnection = recent.set({ port: 27002 });
        });

        it('discards changes', (done) => {
          const unsubscribe = Store.listen((state) => {
            unsubscribe();
            expect(state.currentConnection).to.exist;
            expect(state.currentConnection.port).to.equal(recent.port);
            done();
          });

          Actions.onChangesDiscarded();
        });
      });
    });
  });

  describe('#onSaveAsFavoriteClicked', () => {
    context('when it is a current connection', () => {
      const recent = new Connection({
        hostname: 'localhost',
        port: '27001'
      });
      const connections = {
        [recent._id]: recent.getAttributes({ props: true, derived: true })
      };

      beforeEach(() => {
        Store.state.fetchedConnections = new ConnectionCollection();
        Store.state.fetchedConnections.add(recent);
        Store.state.connections = { ...connections };
        Store.state.currentConnection = recent;
      });

      it('adds recent to favorites', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.connections).to.exist;
          expect(state.currentConnection).to.exist;
          expect(Object.keys(state.connections).length).to.equal(1);
          expect(state.isMessageVisible).to.equal(true);
          expect(state.currentConnection.isFavorite).to.equal(true);
          expect(state.currentConnection.name).to.equal('localhost:27001');
          expect(state.savedMessage).to.equal('Saved to favorites');
          done();
        });

        Actions.onSaveAsFavoriteClicked(connections[recent._id]);
      });
    });

    context('when it is not current connection', () => {
      const currentConnection = new Connection({
        hostname: 'localhost',
        port: '27001'
      });
      const recent = new Connection({
        hostname: 'localhost',
        port: '27002'
      });
      const connections = {
        [recent._id]: recent.getAttributes({ props: true, derived: true })
      };

      beforeEach(() => {
        Store.state.fetchedConnections = new ConnectionCollection();
        Store.state.fetchedConnections.add(recent);
        Store.state.connections = { ...connections };
        Store.state.currentConnection = currentConnection;
      });

      it('adds recent to favorites', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.connections).to.exist;
          expect(state.currentConnection).to.exist;
          expect(Object.keys(state.connections).length).to.equal(1);
          expect(state.isMessageVisible).to.equal(true);
          expect(state.currentConnection.isFavorite).to.equal(true);
          expect(state.currentConnection.name).to.equal('localhost:27002');
          expect(state.savedMessage).to.equal('Saved to favorites');
          done();
        });

        Actions.onSaveAsFavoriteClicked(connections[recent._id]);
      });
    });
  });

  describe('#onConnectClicked', () => {
    const favorite = new Connection({
      hostname: 'server.example.com',
      port: 27001,
      authStrategy: 'MONGODB',
      mongodbUsername: 'user',
      mongodbPassword: 'password',
      name: 'Compass',
      color: '#3b8196',
      isFavorite: true
    });
    const connections = {
      [favorite._id]: favorite.getAttributes({ props: true, derived: true })
    };

    beforeEach(() => {
      Store.state.isURIEditable = false;
      Store.state.viewType = 'connectionString';
      Store.state.customUrl =
        'mongodb://user:*****@localhost:27018/?authSource=admin&readPreference=primary&ssl=false';
      Store.state.fetchedConnections = new ConnectionCollection();
      Store.state.fetchedConnections.add(favorite);
      Store.state.connections = { ...connections };
      Store.state.currentConnection = favorite;
      Store._connect = (parsedConnection) => {
        Store.state.currentConnection = parsedConnection;
        Store.trigger(Store.state);
      };
      Store.StatusActions = { showIndeterminateProgressBar: () => {} };
    });

    it('uses a real password when builds a driverUrl', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.driverUrl).to.equal(
          'mongodb://user:password@server.example.com:27001/?authSource=admin&readPreference=primary&appname=Electron&ssl=false'
        );
        done();
      });

      Actions.onConnectClicked();
    });
  });

  describe('#onSaveFavoriteClicked', () => {
    context('when it is a connection form view', () => {
      const favorite = new Connection({
        hostname: 'localhost',
        port: 27001,
        name: 'It is a favorite connection',
        color: '#3b8196',
        isFavorite: true
      });
      const connections = {
        [favorite._id]: favorite.getAttributes({ props: true, derived: true })
      };

      beforeEach(() => {
        Store.state.isURIEditable = true;
        Store.state.viewType = 'connectionForm';
        Store.state.fetchedConnections = new ConnectionCollection();
        Store.state.fetchedConnections.add(favorite);
        Store.state.connections = { ...connections };
        Store.state.currentConnection = favorite.set({
          port: 27018,
          name: 'New name',
          color: '#5fc86e'
        });
      });

      it('updates properties of the saved connection', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.connections).to.exist;
          expect(state.currentConnection).to.exist;
          expect(Object.keys(state.connections).length).to.equal(1);
          expect(state.currentConnection._id).to.equal(favorite._id);
          expect(state.currentConnection.port).to.equal(27018);
          expect(state.currentConnection.name).to.equal('New name');
          expect(state.currentConnection.color).to.equal('#5fc86e');
          expect(state.currentConnection.isFavorite).to.equal(true);
          expect(state.connections[favorite._id].port).to.equal(27018);
          expect(state.connections[favorite._id].name).to.equal('New name');
          expect(state.connections[favorite._id].color).to.equal('#5fc86e');
          expect(state.connections[favorite._id].isFavorite).to.equal(true);
          expect(state.isURIEditable).to.equal(false);
          done();
        });

        Actions.onSaveFavoriteClicked();
      });
    });

    context('when it is a connection string view', () => {
      const favorite = new Connection({
        hostname: 'server.example.com',
        port: 27001,
        authStrategy: 'MONGODB',
        mongodbUsername: 'user',
        mongodbPassword: 'somepass',
        name: 'It is a favorite connection',
        color: '#3b8196',
        isFavorite: true
      });
      const connections = {
        [favorite._id]: favorite.getAttributes({ props: true, derived: true })
      };

      beforeEach(() => {
        Store.state.isURIEditable = true;
        Store.state.viewType = 'connectionString';
        Store.state.customUrl =
          'mongodb://user:somepass@localhost:27018/?authSource=admin&readPreference=primary&ssl=false';
        Store.state.fetchedConnections = new ConnectionCollection();
        Store.state.fetchedConnections.add(favorite);
        Store.state.connections = { ...connections };
        Store.state.currentConnection = favorite;
      });

      it('updates properties of the saved connection', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.connections).to.exist;
          expect(state.currentConnection).to.exist;
          expect(Object.keys(state.connections).length).to.equal(1);
          expect(state.currentConnection._id).to.equal(favorite._id);
          expect(state.currentConnection.port).to.equal(27018);
          expect(state.currentConnection.name).to.equal(
            'It is a favorite connection'
          );
          expect(state.currentConnection.color).to.equal('#3b8196');
          expect(state.currentConnection.isFavorite).to.equal(true);
          expect(state.connections[favorite._id].port).to.equal(27018);
          expect(state.connections[favorite._id].isFavorite).to.equal(true);
          done();
        });

        Actions.onSaveFavoriteClicked();
      });

      it('updates customUrl with a safe value', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.customUrl).to.equal(
            'mongodb://user:*****@localhost:27018/?authSource=admin&readPreference=primary&ssl=false'
          );
          done();
        });

        Actions.onSaveFavoriteClicked();
      });
    });
  });

  describe('#onEditURIClicked', () => {
    beforeEach(() => {
      Store.state.isURIEditable = false;
      Store.state.isEditURIConfirm = false;
    });

    it('shows a confirmation modal', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isURIEditable).to.equal(false);
        expect(state.isEditURIConfirm).to.equal(true);
        done();
      });

      Actions.onEditURIClicked();
    });
  });

  describe('#onEditURIConfirmed', () => {
    beforeEach(() => {
      Store.state.isURIEditable = false;
      Store.state.isEditURIConfirm = true;
    });

    it('makes a connection string input editable', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isURIEditable).to.equal(true);
        expect(state.isEditURIConfirm).to.equal(false);
        done();
      });

      Actions.onEditURIConfirmed();
    });
  });

  describe('#onEditURICanceled', () => {
    beforeEach(() => {
      Store.state.isURIEditable = false;
      Store.state.isEditURIConfirm = true;
    });

    it('hides a confirmation modal', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isURIEditable).to.equal(false);
        expect(state.isEditURIConfirm).to.equal(false);
        done();
      });

      Actions.onEditURICanceled();
    });
  });

  describe('#onHideURIClicked', () => {
    beforeEach(() => {
      Store.state.isURIEditable = true;
      Store.state.isEditURIConfirm = false;
    });

    it('makes URI read-only', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isURIEditable).to.equal(false);
        expect(state.isEditURIConfirm).to.equal(false);
        done();
      });

      Actions.onHideURIClicked();
    });
  });
});
