const { expect } = require('chai');
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
});
