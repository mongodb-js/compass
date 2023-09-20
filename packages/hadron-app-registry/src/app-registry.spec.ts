import { expect } from 'chai';
import sinon from 'sinon';
import Reflux from 'reflux';
import { AppRegistry } from './';
import { Actions } from './actions';

describe('AppRegistry', function () {
  describe('getStore', function () {
    context('when the store does not exist', function () {
      let registry: AppRegistry;
      let storeLike;

      before(function () {
        registry = new AppRegistry();
        storeLike = registry.getStore('Test.Store');
      });

      it('returns undefined', function () {
        expect(storeLike).to.equal(undefined);
      });
    });
  });

  describe('#onActivated', function () {
    context('when the method is defined on the store', function () {
      let registry: AppRegistry;
      let spyOne: any;
      let spyTwo: any;
      let storeOne: any;
      let storeTwo: any;

      beforeEach(function () {
        spyOne = sinon.spy();
        spyTwo = sinon.spy();
        storeOne = Reflux.createStore({
          onActivated: (reg) => {
            spyOne(reg);
          },
        });
        storeTwo = Reflux.createStore({
          onActivated: (reg) => {
            spyTwo(reg);
          },
        });
        registry = new AppRegistry()
          .registerStore('TestStore1', storeOne)
          .registerStore('TestStore2', storeTwo);
      });

      it('calls onActivated on the store', function () {
        registry.onActivated();
        expect(spyOne.calledWith(registry)).to.equal(true);
        expect(spyTwo.calledWith(registry)).to.equal(true);
      });
    });

    context('when the method is not defined on the store', function () {
      let registry: AppRegistry;
      let store: any;

      beforeEach(function () {
        store = Reflux.createStore({});
        registry = new AppRegistry().registerStore('TestStore', store);
      });

      it('does not call onActivated on the store', function () {
        expect(registry.onActivated()).to.equal(registry);
      });
    });
  });

  describe('#emit data-service-connected', function () {
    context('when a listener exists', function () {
      let registry: AppRegistry;
      let spy: any;
      let store: any;

      beforeEach(function () {
        spy = sinon.spy();
        store = Reflux.createStore({
          onActivated: (ar) => {
            ar.on('data-service-connected', (error, ds) => {
              spy(error, ds);
            });
          },
        });
        registry = new AppRegistry().registerStore('TestStore', store);
        registry.onActivated();
      });

      it('calls onConnected on the store', function () {
        registry.emit('data-service-connected', 'error', 'ds');
        expect(spy.callCount).to.equal(1);
      });
    });
  });

  describe('#registerAction', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry().registerAction('TestAction', 'testing');
    });

    it('registers the action', function () {
      expect(registry.actions.TestAction).to.equal('testing');
    });

    it('allows access via the getter', function () {
      expect(registry.getAction('TestAction')).to.equal('testing');
    });

    it('publishes an action registered action', function (done) {
      const unsubscribe = Actions.actionRegistered.listen((name) => {
        expect(name).to.equal('TestAction');
        unsubscribe();
        done();
      });
    });

    context('when the action already exists', function () {
      beforeEach(function () {
        registry.registerAction('TestAction', 'override');
      });

      it('publishes an action overridden action', function (done) {
        const unsubscribe = Actions.actionOverridden.listen((name) => {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerComponent', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry().registerComponent('IndexView', 'testing');
    });

    it('registers the component', function () {
      expect(registry.components.IndexView).to.equal('testing');
    });

    it('allows access via the getter', function () {
      expect(registry.getComponent('IndexView')).to.equal('testing');
    });

    it('publishes a component registered action', function (done) {
      const unsubscribe = Actions.componentRegistered.listen((name) => {
        expect(name).to.equal('IndexView');
        unsubscribe();
        done();
      });
    });

    context('when the component already exists', function () {
      beforeEach(function () {
        registry.registerComponent('IndexView', 'override');
      });

      it('publishes a component overridden action', function (done) {
        const unsubscribe = Actions.componentOverridden.listen((name) => {
          expect(name).to.equal('IndexView');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerRole', function () {
    let registry: AppRegistry;

    const role = {
      component: 'collection-tab',
      name: 'another tab',
      order: 2,
    };

    const roleTwo = {
      component: 'collection-tab-two',
      name: 'another tab two',
      order: 1,
    };

    const roleThree = {
      component: 'collection-tab-three',
      name: 'another tab three',
    };

    beforeEach(function () {
      registry = new AppRegistry().registerRole('Role.Collection.Tab', role);
    });

    it('registers the component', function () {
      expect(registry.roles['Role.Collection.Tab']).to.deep.equal([role]);
    });

    it('allows access via the getter', function () {
      expect(registry.getRole('Role.Collection.Tab')).to.deep.equal([role]);
    });

    it('publishes a role registered action', function (done) {
      const unsubscribe = Actions.roleRegistered.listen((name) => {
        expect(name).to.equal('Role.Collection.Tab');
        unsubscribe();
        done();
      });
    });

    context('when the component already exists', function () {
      beforeEach(function () {
        registry.registerRole('Role.Collection.Tab', role);
      });

      it('does not register the duplicate', function () {
        expect(registry.roles['Role.Collection.Tab']).to.deep.equal([role]);
      });
    });

    context('when the component does not already exists', function () {
      context('when the role defines an order', function () {
        beforeEach(function () {
          registry.registerRole('Role.Collection.Tab', roleTwo);
        });

        it('registers the additional component in order', function () {
          expect(registry.roles['Role.Collection.Tab']).to.deep.equal([
            roleTwo,
            role,
          ]);
        });
      });

      context('when the role does not define an order', function () {
        beforeEach(function () {
          registry
            .registerRole('Role.Collection.Tab', roleTwo)
            .registerRole('Role.Collection.Tab', roleThree);
        });

        it('registers the additional component in order', function () {
          expect(registry.roles['Role.Collection.Tab']).to.deep.equal([
            roleTwo,
            role,
            roleThree,
          ]);
        });
      });
    });
  });

  describe('#registerStore', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry().registerStore('IndexStore', 'testing');
    });

    it('registers the store', function () {
      expect(registry.stores.IndexStore).to.equal('testing');
    });

    it('allows access via the getter', function () {
      expect(registry.getStore('IndexStore')).to.equal('testing');
    });

    it('publishes a store registered action', function (done) {
      const unsubscribe = Actions.storeRegistered.listen((name) => {
        expect(name).to.equal('IndexStore');
        unsubscribe();
        done();
      });
    });

    context('when the store already exists', function () {
      beforeEach(function () {
        registry.registerStore('IndexStore', 'override');
      });

      it('publishes a store overridden action', function (done) {
        const unsubscribe = Actions.storeOverridden.listen((name) => {
          expect(name).to.equal('IndexStore');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterAction', function () {
    context('when the action exists', function () {
      let registry: AppRegistry;

      beforeEach(function () {
        registry = new AppRegistry()
          .registerAction('TestAction', 'testing')
          .deregisterAction('TestAction');
      });

      it('deregisters the action', function () {
        expect(registry.actions.TestAction).to.equal(undefined);
      });

      it('publishes an action deregisted action', function (done) {
        const unsubscribe = Actions.actionDeregistered.listen((name) => {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterComponent', function () {
    context('when the component exists', function () {
      let registry: AppRegistry;

      beforeEach(function () {
        registry = new AppRegistry()
          .registerComponent('TestComponent', 'testing')
          .deregisterComponent('TestComponent');
      });

      it('deregisters the component', function () {
        expect(registry.components.TestComponent).to.equal(undefined);
      });

      it('publishes a component deregisted action', function (done) {
        const unsubscribe = Actions.componentDeregistered.listen((name) => {
          expect(name).to.equal('TestComponent');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterRole', function () {
    const role = {
      component: 'collection-tab',
      name: 'another tab',
      order: 2,
    };

    const roleTwo = {
      component: 'collection-tab-two',
      name: 'another tab two',
      order: 1,
    };

    context('when the role exists', function () {
      let registry: AppRegistry;

      beforeEach(function () {
        registry = new AppRegistry()
          .registerRole('TestRole', role)
          .registerRole('TestRole', roleTwo)
          .deregisterRole('TestRole', roleTwo);
      });

      it('deregisters the role', function () {
        expect(registry.roles.TestRole).to.deep.equal([role]);
      });

      it('publishes a role deregisted action', function (done) {
        const unsubscribe = Actions.roleDeregistered.listen((name) => {
          expect(name).to.equal('TestRole');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterStore', function () {
    context('when the store exists', function () {
      let registry: AppRegistry;

      beforeEach(function () {
        registry = new AppRegistry()
          .registerStore('TestStore', 'testing')
          .deregisterStore('TestStore');
      });

      it('deregisters the store', function () {
        expect(registry.stores.TestStore).to.equal(undefined);
      });

      it('publishes a store deregisted action', function (done) {
        const unsubscribe = Actions.storeDeregistered.listen((name) => {
          expect(name).to.equal('TestStore');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#emit', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('emits the event', function (done) {
      registry.once('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#on', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('subscribes to the event', function (done) {
      registry.on('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#once', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('subscribes to the event once', function (done) {
      registry.once('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#addListener', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
    });

    it('adds the listener to the event', function (done) {
      registry.addListener('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#removeListener', function () {
    let registry: AppRegistry;
    const listener = () => {
      return true;
    };

    beforeEach(function () {
      registry = new AppRegistry();
      registry.addListener('test-event', listener);
    });

    it('removes the listener', function () {
      registry.removeListener('test-event', listener);
      expect(registry.listenerCount('test-event')).to.equal(0);
    });
  });

  describe('#removeAllListeners', function () {
    let registry: AppRegistry;
    const listenerOne = () => {
      return true;
    };
    const listenerTwo = () => {
      return true;
    };

    beforeEach(function () {
      registry = new AppRegistry();
      registry.addListener('test-event', listenerOne);
      registry.addListener('test-event', listenerTwo);
    });

    it('removes all the listeners', function () {
      registry.removeAllListeners('test-event');
      expect(registry.listenerCount('test-event')).to.equal(0);
    });
  });

  describe('#eventNames', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = new AppRegistry();
      registry.on('test-event', () => {
        return true;
      });
    });

    it('returns the names of all events', function () {
      expect(registry.eventNames()).to.deep.equal(['test-event']);
    });
  });

  describe('#listeners', function () {
    let registry: AppRegistry;
    const listenerOne = () => {
      return true;
    };
    const listenerTwo = () => {
      return true;
    };

    beforeEach(function () {
      registry = new AppRegistry();
      registry.addListener('test-event', listenerOne);
      registry.addListener('test-event', listenerTwo);
    });

    it('returns the listeners for the event', function () {
      expect(registry.listeners('test-event')).to.deep.equal([
        listenerOne,
        listenerTwo,
      ]);
    });
  });

  context('when freezing the app registry', function () {
    let registry: AppRegistry;

    beforeEach(function () {
      registry = Object.freeze(new AppRegistry());
    });

    context('when adding a listener', function () {
      const addListener = () => {
        registry.on('test', () => {
          return true;
        });
      };

      it('allows the edition', function () {
        expect(addListener).to.not.throw();
      });
    });

    context('when registering an object', function () {
      const registerStore = () => {
        registry.registerStore('test', 'testing');
      };

      it('allows the registration', function () {
        expect(registerStore).to.not.throw();
      });
    });

    context('when deregistering an object', function () {
      beforeEach(function () {
        registry.registerStore('test', 'testing');
      });

      const deregisterStore = () => {
        registry.registerStore('test');
      };

      it('allows the registration', function () {
        expect(deregisterStore).to.not.throw();
      });
    });

    context('when modifying the object', function () {
      const modify = () => {
        registry.emit = () => {
          /* ignore */
        };
      };

      it('raises an error', function () {
        expect(modify).to.throw();
      });
    });
  });
});
