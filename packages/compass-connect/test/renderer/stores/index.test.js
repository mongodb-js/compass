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
});
