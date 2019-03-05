import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import store from 'stores';
import { reset } from 'modules/reset';

import { makeModel } from '../../electron/renderer/stores/instance-store';

const WriteStateStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { isWritable: true, description: 'store initial state description' };
  }
});

const instance = {
  instance: {
    databases: [
      {_id: 'admin', collections: ['citibikecoll', 'coll']},
      {_id: 'citibike', collections: ['admincoll', 'coll2']}
    ].map((d) => (makeModel(d))),
    collections: [
      { _id: 'citibikecoll' }, { _id: 'coll' }, { _id: 'admincoll' }, { _id: 'coll2' }
    ]
  }
};


describe('IndexesStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();
    appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);

    before(() => {
      store.onActivated(appRegistry);
    });

    context('when write state changes', () => {
      beforeEach(() => {
        expect(store.getState().isWritable).to.equal(true); // initial state
        WriteStateStore.setState({
          isWritable: false,
          description: 'test description'
        });
      });

      it('dispatches the change write state action', () => {
        expect(store.getState().isWritable).to.equal(false);
        expect(store.getState().description).to.equal('test description');
      });
    });

    context('when instance state changes', () => {
      beforeEach(() => {
        expect(store.getState().instance).to.deep.equal({
          collections: null,
          databases: null
        }); // initial state
        expect(store.getState().databases).to.deep.equal({
          databases: [],
          expandedDblist: {},
          activeNamespace: ''
        }); // initial state
        appRegistry.emit('instance-refreshed', instance);
      });

      it('updates the instance and databases state', () => {
        expect(store.getState().instance).to.deep.equal(instance.instance);
        expect(store.getState().databases).to.deep.equal({
          databases: [{'_id': 'admin', 'collections': [{'_id': 'admin.citibikecoll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}, {'_id': 'admin.coll', 'database': 'admin', 'capped': false, 'power_of_two': false, 'readonly': false}]}, {'_id': 'citibike', 'collections': [{'_id': 'citibike.admincoll', 'database': 'citibike', 'capped': false, 'power_of_two': false, 'readonly': false}, {'_id': 'citibike.coll2', 'database': 'citibike', 'capped': false, 'power_of_two': false, 'readonly': false}]}],
          expandedDblist: {'admin': false, 'citibike': false},
          activeNamespace: ''
        });
      });
    });

    context('when collection changes', () => {
      beforeEach(() => {
        expect(store.getState().databases.activeNamespace).to.equal('');
        appRegistry.emit('collection-changed', 'test.coll');
      });
      it('updates databases.activeNamespace', () => {
        expect(store.getState().databases.activeNamespace).to.equal('test.coll');
      });
    });

    context('when db changes', () => {
      beforeEach(() => {
        expect(store.getState().databases.activeNamespace).to.equal('');
        appRegistry.emit('database-changed', 'test');
      });
      it('updates databases.activeNamespace', () => {
        expect(store.getState().databases.activeNamespace).to.equal('test');
      });
    });
  });
});
