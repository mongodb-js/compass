const { expect } = require('chai');
const Connection = require('../../../lib/models/connection');
const Actions = require('../../../lib/actions');
const IndexStore = require('../../../lib/stores');

describe('IndexStore', () => {
  afterEach(() => {
    IndexStore.state = IndexStore.getInitialState();
  });

  describe('#getInitialState', () => {
    it('initializes with an empty current connection', () => {
      expect(IndexStore.state.currentConnection.username).to.equal('');
    });
  });

  describe('#resetConnection', () => {
    before(() => {
      IndexStore.state.currentConnection.mongodb_username = 'testing';
    });

    it('updates the hostname in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.mongodb_username).to.equal(undefined);
        unsubscribe();
        done();
      });
      Actions.resetConnection();
    });
  });

  describe('#onHostnameChanged', () => {
    it('updates the hostname in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.hostname).to.equal('myserver');
        unsubscribe();
        done();
      });
      Actions.onHostnameChanged('myserver');
    });
  });

  describe('#onPortChanged', () => {
    it('updates the port in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.port).to.equal('27019');
        unsubscribe();
        done();
      });
      Actions.onPortChanged('27019');
    });
  });

  describe('#onReplicaSetNameChanged', () => {
    it('updates the replica set name in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.replica_set_name).to.equal('myreplicaset');
        unsubscribe();
        done();
      });
      Actions.onReplicaSetNameChanged('myreplicaset');
    });
  });

  describe('#onReadPreferenceChanged', () => {
    it('updates the read preference in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.read_preference).to.equal('primaryPreferred');
        unsubscribe();
        done();
      });
      Actions.onReadPreferenceChanged('primaryPreferred');
    });
  });

  describe('#onSSLMethodChanged', () => {
    it('updates the ssl method in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssl).to.equal('SYSTEMCA');
        unsubscribe();
        done();
      });
      Actions.onSSLMethodChanged('SYSTEMCA');
    });
  });

  describe('#onAuthenticationMethodChanged', () => {
    it('updates the authentication method in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.authentication).to.equal('MONGODB');
        unsubscribe();
        done();
      });
      Actions.onAuthenticationMethodChanged('MONGODB');
    });
  });

  describe('#onUsernameChanged', () => {
    it('updates the username in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.mongodb_username).to.equal('user');
        unsubscribe();
        done();
      });
      Actions.onUsernameChanged('user');
    });
  });

  describe('#onPasswordChanged', () => {
    it('updates the password in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.mongodb_password).to.equal('pass');
        unsubscribe();
        done();
      });
      Actions.onPasswordChanged('pass');
    });
  });

  describe('#onAuthSourceChanged', () => {
    it('updates the auth source in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.mongodb_database_name).to.equal('database');
        unsubscribe();
        done();
      });
      Actions.onAuthSourceChanged('database');
    });
  });

  describe('#onSSLCAChanged', () => {
    it('updates the ssl ca field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssl_ca).to.deep.equal(['file']);
        unsubscribe();
        done();
      });
      Actions.onSSLCAChanged(['file']);
    });
  });

  describe('#onSSLCertificateChanged', () => {
    it('updates the ssl certificate field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssl_certificate).to.deep.equal(['file']);
        unsubscribe();
        done();
      });
      Actions.onSSLCertificateChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyChanged', () => {
    it('updates the ssl private key field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssl_private_key).to.deep.equal(['file']);
        unsubscribe();
        done();
      });
      Actions.onSSLPrivateKeyChanged(['file']);
    });
  });

  describe('#onSSLPrivateKeyPasswordChanged', () => {
    it('updates the ssl private key password field in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssl_private_key_password).to.equal('testing');
        unsubscribe();
        done();
      });
      Actions.onSSLPrivateKeyPasswordChanged('testing');
    });
  });

  describe('#onFavoriteNameChanged', () => {
    it('updates the name on the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.name).to.equal('myconnection');
        unsubscribe();
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
        expect(state.currentConnection.is_favorite).to.equal(true);
        expect(state.connections.length).to.equal(1);
        unsubscribe();
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
          expect(state.currentConnection.is_favorite).to.equal(false);
          expect(state.currentConnection.last_used).to.not.equal(undefined);
          expect(state.connections.length).to.equal(1);
          unsubscribe();
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
          IndexStore.state.connections.reset();
          unsubscribe();
          done();
        });
        IndexStore.onDeleteConnection(IndexStore.state.currentConnection);
      });

      it('limits the recent connections to 10', (done) => {
        const unsubscribe = IndexStore.listen((state) => {
          expect(state.currentConnection.is_favorite).to.equal(false);
          expect(state.currentConnection.last_used).to.not.equal(undefined);
          expect(state.connections.length).to.equal(11);
          unsubscribe();
          done();
        });
        Actions.onCreateRecent();
      });
    });
  });

  describe('#onSSHTunnelPortChanged', () => {
    it('updates the SSH Tunnel port in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssh_tunnel_port).to.equal('5000');
        unsubscribe();
        done();
      });
      Actions.onSSHTunnelPortChanged('5000');
    });
  });

  describe('#onSSHTunnelUsernameChanged', () => {
    it('updates the SSH Tunnel username in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssh_tunnel_username).to.equal('mongodb');
        unsubscribe();
        done();
      });
      Actions.onSSHTunnelUsernameChanged('mongodb');
    });
  });

  describe('#onSSHTunnelHostnameChanged', () => {
    it('updates the SSH Tunnel hostname in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssh_tunnel_hostname).to.equal('localhost');
        unsubscribe();
        done();
      });
      Actions.onSSHTunnelHostnameChanged('localhost');
    });
  });

  describe('#onSSHTunnelPasswordChanged', () => {
    it('updates the SSH Tunnel password in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssh_tunnel_password).to.equal('mongodb');
        unsubscribe();
        done();
      });
      Actions.onSSHTunnelPasswordChanged('mongodb');
    });
  });

  describe('#onSSHTunnelPassphraseChanged', () => {
    it('updates the SSH Tunnel passphrase in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssh_tunnel_passphrase).to.equal('mongodb');
        unsubscribe();
        done();
      });
      Actions.onSSHTunnelPassphraseChanged('mongodb');
    });
  });

  describe('#onSSHTunnelIdentityFileChanged', () => {
    it('updates the SSH Tunnel identity file in the current connection model', (done) => {
      const unsubscribe = IndexStore.listen((state) => {
        expect(state.currentConnection.ssh_tunnel_identity_file).to.deep.equal(['file']);
        unsubscribe();
        done();
      });
      Actions.onSSHTunnelIdentityFileChanged(['file']);
    });
  });
});
