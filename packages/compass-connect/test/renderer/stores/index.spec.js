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

  describe('#onResetConnectionClicked', () => {
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

        Actions.onResetConnectionClicked();
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
          const syntaxErrorMessage = 'Invalid schema, expected `mongodb` or `mongodb+srv`';
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
          const syntaxErrorMessage = 'Value for `compressors` must be at least one of: `snappy`, `zlib`';
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
          const syntaxErrorMessage = 'Invalid schema, expected `mongodb` or `mongodb+srv`';
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

  describe('#onSRVRecordToggled', () => {
    afterEach(() => {
      Store.state.currentConnection.isSrvRecord = false;
    });

    it('updates the srv record property', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
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
        expect(state.syntaxErrorMessage).to.equal(null);
        done();
      });

      Actions.onConnectionSelected(connection);
    });
  });

  describe('#onFavoriteSelected', () => {
    const connection = new Connection();

    it('sets the current connection in the store', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection).to.equal(connection);
        expect(state.isValid).to.equal(true);
        expect(state.isConnected).to.equal(false);
        expect(state.errorMessage).to.equal(null);
        expect(state.syntaxErrorMessage).to.equal(null);
        expect(state.viewType).to.equal('connectionForm');
        done();
      });

      Actions.onFavoriteSelected(connection);
    });
  });

  describe('#onConnectionFormChanged', () => {
    before(() => {
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

    before(() => {
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
          beforeEach(() => {
            Store.state.isValid = true;
            Store.state.viewType = 'connectionString';
            Store.state.customUrl = 'mongodb://server.example.com/';
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

          it('sets the driverUrl', (done) => {
            const driverUrl = 'mongodb://server.example.com:27017/?readPreference=primary&ssl=false';
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
              expect(state.currentConnection.driverUrl).to.equal(driverUrl);
              done();
            });

            Actions.onChangeViewClicked('connectionForm');
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
            const driverUrl = 'mongodb://localhost:27017/?readPreference=primary&ssl=false';
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
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
            const driverUrl = 'mongodb://localhost:27017/?readPreference=primary&ssl=false';
            const unsubscribe = Store.listen((state) => {
              unsubscribe();
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
        context('when a current connection string is valid', () => {
          beforeEach(() => {
            Store.state.isValid = true;
            Store.state.viewType = 'connectionForm';
            Store.state.customUrl = 'mongodb://server.example.com/';
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
              expect(state.isValid).to.equal(true);
              expect(state.errorMessage).to.equal(null);
              expect(state.syntaxErrorMessage).to.equal(null);
              done();
            });

            Actions.onChangeViewClicked('connectionForm');
          });
        });

        context('when a current connection string is invalid', () => {
          context('when a form was changed', () => {
            beforeEach(() => {
              Store.state.isValid = true;
              Store.state.viewType = 'connectionForm';
              Store.state.customUrl = 'fake';
              Store.state.currentConnection.hostname = 'test';
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
                expect(state.customUrl).to.equal('mongodb://test:27017/?readPreference=primary&ssl=false');
                expect(state.errorMessage).to.equal(null);
                expect(state.syntaxErrorMessage).to.equal(null);
                done();
              });

              Actions.onChangeViewClicked('connectionString');
            });
          });

          context('when a form was not changed', () => {
            const syntaxErrorMessage = 'Invalid schema, expected `mongodb` or `mongodb+srv`';

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
        expect(state.currentConnection.name).to.equal('myconnection');
        done();
      });

      Actions.onFavoriteNameChanged('myconnection');
    });
  });

  describe('#onCreateFavoriteClicked', () => {
    before(() => {
      Store.state.currentConnection.name = 'myconnection';
    });

    after((done) => {
      Store.onDeleteConnectionClicked(Store.state.currentConnection);
      done();
    });

    it('creates a new favorite in the store', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.currentConnection.isFavorite).to.equal(true);
        expect(state.connections.length).to.equal(1);
        done();
      });

      Actions.onCreateFavoriteClicked();
    });
  });

  describe('#onCreateRecentClicked', () => {
    context('when the list is under 10 recent connections', () => {
      after((done) => {
        Store.onDeleteConnectionClicked(Store.state.currentConnection);
        done();
      });

      it('creates a new recent in the store', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.isFavorite).to.equal(false);
          expect(state.currentConnection.lastUsed).to.not.equal(undefined);
          expect(state.connections.length).to.equal(1);
          done();
        });

        Actions.onCreateRecentClicked();
      });
    });

    context('when the list has 10 recent connections', () => {
      before(() => {
        Store.state.connections.add(new Connection({ isFavorite: true }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-01') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-02') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-03') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-04') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-08') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-09') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-10') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-05') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-06') }));
        Store.state.connections.add(new Connection({ lastUsed: new Date('2017-01-07') }));
      });

      after((done) => {
        Store.onDeleteConnectionClicked(Store.state.currentConnection);
        done();
      });

      it('limits the recent connections to 10', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.currentConnection.isFavorite).to.equal(false);
          expect(state.currentConnection.lastUsed).to.not.equal(undefined);
          expect(state.connections.length).to.equal(11);
          done();
        });

        Actions.onCreateRecentClicked();
      });
    });
  });

  describe('#updateDefaults', () => {
    context('when auth is mongodb', () => {
      context('when the database name is empty', () => {
        beforeEach(() => {
          Store.state.currentConnection.authStrategy = 'MONGODB';
          Store.state.currentConnection.mongodbDatabaseName = '';
          Store._updateDefaults();
        });

        afterEach(() => {
          Store.state.currentConnection = new Connection();
        });

        it('sets the database name to admin', () => {
          expect(Store.state.currentConnection.mongodbDatabaseName).to.equal('admin');
        });
      });
    });

    context('when auth is kerberos', () => {
      context('when the service name is empty', () => {
        before(() => {
          Store.state.currentConnection.authStrategy = 'KERBEROS';
          Store._updateDefaults();
        });

        after(() => {
          Store.state.currentConnection = new Connection();
        });

        it('sets the service name to mongodb', () => {
          expect(Store.state.currentConnection.kerberosServiceName).to.equal('mongodb');
        });
      });
    });
  });
});
