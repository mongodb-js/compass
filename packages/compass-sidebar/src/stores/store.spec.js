import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import store from './';
import { reset } from '../modules/reset';
import { createInstance } from '../../test/helpers';

const WriteStateStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { isWritable: true, description: 'store initial state description' };
  }
});

const instance = createInstance();

describe('SidebarStore [Store]', () => {
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

    context('when instance created', () => {
      beforeEach(() => {
        expect(store.getState().instance).to.deep.equal(null); // initial state
        expect(store.getState().databases).to.deep.equal({
          databases: [],
          filteredDatabases: [],
          expandedDbList: {},
          filterRegex: null,
          activeNamespace: ''
        }); // initial state
        appRegistry.emit('instance-created', { instance });
      });

      it('updates the instance and databases state', () => {
        expect(store.getState()).to.have.property('instance').deep.equal(instance.toJSON());
        expect(store.getState()).to.have.property('databases').deep.equal({
          databases: instance.databases.toJSON(),
          filteredDatabases: instance.databases.toJSON(),
          activeNamespace: '',
          expandedDbList: {},
          filterRegex: null,
        });
      });
    });

    context('when collection changes', () => {
      beforeEach(() => {
        expect(store.getState().databases.activeNamespace).to.equal('');
        appRegistry.emit('select-namespace', { namespace: 'test.coll' });
      });
      it('updates databases.activeNamespace', () => {
        expect(store.getState().databases.activeNamespace).to.equal('test.coll');
      });
    });

    context('when db changes', () => {
      beforeEach(() => {
        expect(store.getState().databases.activeNamespace).to.equal('');
        appRegistry.emit('select-database', 'test');
      });
      it('updates databases.activeNamespace', () => {
        expect(store.getState().databases.activeNamespace).to.equal('test');
      });
    });
  });
});
