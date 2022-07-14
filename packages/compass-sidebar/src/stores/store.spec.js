import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import store from './';
import { reset } from '../modules/reset';
import { createInstance } from '../../test/helpers';

const instance = createInstance();

function getDatabases(_instance) {
  return _instance.databases.map((db) => {
    return {
      _id: db._id,
      name: db.name,
      collectionsStatus: db.collectionsStatus,
      collectionsLength: db.collectionsLength,
      collections: db.collections.map((coll) => {
        return {
          _id: coll._id,
          name: coll.name,
          type: coll.type,
        };
      }),
    };
  });
}

describe('SidebarStore [Store]', function () {
  beforeEach(function () {
    store.dispatch(reset());
  });

  afterEach(function () {
    store.dispatch(reset());
  });

  describe('#onActivated', function () {
    const appRegistry = new AppRegistry();

    before(function () {
      store.onActivated(appRegistry);
    });

    context('when instance created', function () {
      beforeEach(function () {
        expect(store.getState().instance).to.deep.equal(null); // initial state
        expect(store.getState().databases).to.deep.equal({
          databases: [],
          filteredDatabases: [],
          expandedDbList: {},
          filterRegex: null,
          activeNamespace: '',
        }); // initial state
        appRegistry.emit('instance-created', { instance });
      });

      afterEach(function () {
        appRegistry.emit('instance-destroyed');
      });

      it('updates the instance and databases state', function () {
        const state = store.getState();

        expect(state)
          .to.have.property('instance')
          .deep.equal({
            build: {},
            csfleMode: 'unavailable',
            dataLake: {
              isDataLake: false,
            },
            databasesStatus: 'initial',
            env: 'on-prem',
            genuineMongoDB: {
              isGenuine: true,
            },
            isWritable: false,
            refreshingStatus: 'initial',
            topologyDescription: {
              servers: [],
              setName: 'foo',
              type: 'Unknown',
            },
          });
        expect(state)
          .to.have.property('databases')
          .deep.equal({
            databases: getDatabases(instance),
            filteredDatabases: getDatabases(instance),
            activeNamespace: '',
            expandedDbList: {},
            filterRegex: null,
          });
      });
    });

    context('when collection changes', function () {
      beforeEach(function () {
        expect(store.getState().databases.activeNamespace).to.equal('');
        appRegistry.emit('select-namespace', { namespace: 'test.coll' });
      });
      it('updates databases.activeNamespace', function () {
        expect(store.getState().databases.activeNamespace).to.equal(
          'test.coll'
        );
      });
    });

    context('when db changes', function () {
      beforeEach(function () {
        expect(store.getState().databases.activeNamespace).to.equal('');
        appRegistry.emit('select-database', 'test');
      });
      it('updates databases.activeNamespace', function () {
        expect(store.getState().databases.activeNamespace).to.equal('test');
      });
    });
  });
});
