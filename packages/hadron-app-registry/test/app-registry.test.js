'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Reflux = require('reflux');
const Action = require('../lib/actions');
const AppRegistry = require('../lib/app-registry');

describe('AppRegistry', () => {
  describe('getStore', () => {
    context('when the store does not exist', () => {
      const registry = new AppRegistry();
      let storeLike;

      before(() => {
        storeLike = registry.getStore('Test.Store');
      });

      it('does not return undefined', () => {
        expect(storeLike).to.not.equal(undefined);
      });

      it('returns a store-like object', (done) => {
        const unsubscribe = storeLike.listen((value) => {
          expect(value).to.equal('test');
          unsubscribe();
          done();
        });
        storeLike.trigger('test');
      });

      it('flags the non-existant request', () => {
        expect(registry.storeMisses['Test.Store']).to.equal(1);
      });

      context('when asking for a missing store more than once', () => {
        before(() => {
          registry.getStore('Test.Store');
        });

        it('updates the miss count', () => {
          expect(registry.storeMisses['Test.Store']).to.equal(2);
        });
      });
    });
  });

  describe('#onActivated', () => {
    context('when the method is defined on the store', () => {
      let registry;
      let spyOne = sinon.spy();
      let spyTwo = sinon.spy();
      const storeOne = Reflux.createStore({
        onActivated: (reg) => { spyOne(reg); }
      });
      const storeTwo = Reflux.createStore({
        onActivated: (reg) => { spyTwo(reg); }
      });

      beforeEach(() => {
        registry = new AppRegistry()
          .registerStore('TestStore1', storeOne)
          .registerStore('TestStore2', storeTwo);
      });

      it('calls onActivated on the store', () => {
        registry.onActivated();
        expect(spyOne.calledWith(registry)).to.equal(true);
        expect(spyTwo.calledWith(registry)).to.equal(true);
      });
    });

    context('when the method is not defined on the store', () => {
      let registry;
      const store = Reflux.createStore({});

      beforeEach(() => {
        registry = new AppRegistry().registerStore('TestStore', store);
      });

      it('does not call onActivated on the store', () => {
        expect(registry.onActivated()).to.equal(registry);
      });
    });
  });

  describe('#emit data-service-connected', () => {
    context('when a listener exists', () => {
      let registry;
      let spy = sinon.spy();
      const store = Reflux.createStore({
        onActivated: (ar) => {
          ar.on('data-service-connected', (error, ds) => {
            spy(error, ds);
          });
        }
      });

      beforeEach(() => {
        registry = new AppRegistry().registerStore('TestStore', store);
        registry.onActivated();
      });

      it('calls onConnected on the store', () => {
        registry.emit('data-service-connected', 'error', 'ds');
        expect(spy.callCount).to.equal(1);
      });
    });
  });

  describe('#registerAction', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry().registerAction('TestAction', 'testing');
    });

    it('registers the action', () => {
      expect(registry.actions.TestAction).to.equal('testing');
    });

    it('allows access via the getter', () => {
      expect(registry.getAction('TestAction')).to.equal('testing');
    });

    it('publishes an action registered action', (done) => {
      const unsubscribe = Action.actionRegistered.listen((name) => {
        expect(name).to.equal('TestAction');
        unsubscribe();
        done();
      });
    });

    context('when the action already exists', () => {
      beforeEach(() => {
        registry.registerAction('TestAction', 'override');
      });

      it('publishes an action overridden action', (done) => {
        const unsubscribe = Action.actionOverridden.listen((name) => {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerContainer', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry().registerContainer('Collection.Tab', 'test');
    });

    it('registers the component', () => {
      expect(registry.containers['Collection.Tab']).to.deep.equal([ 'test' ]);
    });

    it('allows access via the getter', () => {
      expect(registry.getContainer('Collection.Tab')).to.deep.equal([ 'test' ]);
    });

    it('publishes a container registered action', (done) => {
      const unsubscribe = Action.containerRegistered.listen((name) => {
        expect(name).to.equal('Collection.Tab');
        unsubscribe();
        done();
      });
    });

    context('when the component already exists', () => {
      beforeEach(() => {
        registry.registerContainer('Collection.Tab', 'test');
      });

      it('does not register the duplicate', () => {
        expect(registry.containers['Collection.Tab']).to.deep.equal([ 'test' ]);
      });
    });

    context('when the component does not already exists', () => {
      beforeEach(() => {
        registry.registerContainer('Collection.Tab', 'testing');
      });

      it('registers the additional component', () => {
        expect(registry.containers['Collection.Tab']).to.deep.equal([ 'test', 'testing' ]);
      });
    });
  });

  describe('#registerComponent', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry().registerComponent('IndexView', 'testing');
    });

    it('registers the component', () => {
      expect(registry.components.IndexView).to.equal('testing');
    });

    it('allows access via the getter', () => {
      expect(registry.getComponent('IndexView')).to.equal('testing');
    });

    it('publishes a component registered action', (done) => {
      const unsubscribe = Action.componentRegistered.listen((name) => {
        expect(name).to.equal('IndexView');
        unsubscribe();
        done();
      });
    });

    context('when the component already exists', () => {
      beforeEach(() => {
        registry.registerComponent('IndexView', 'override');
      });

      it('publishes a component overridden action', (done) => {
        const unsubscribe = Action.componentOverridden.listen((name) => {
          expect(name).to.equal('IndexView');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerRole', () => {
    let registry;

    const role = {
      component: 'collection-tab',
      name: 'another tab',
      order: 2,
      minimumServerVersion: '3.2.0-rc0'
    };

    const roleTwo = {
      component: 'collection-tab-two',
      name: 'another tab two',
      order: 1
    };

    const roleThree = {
      component: 'collection-tab-three',
      name: 'another tab three'
    };

    beforeEach(() => {
      registry = new AppRegistry().registerRole('Role.Collection.Tab', role);
    });

    it('registers the component', () => {
      expect(registry.roles['Role.Collection.Tab']).to.deep.equal([ role ]);
    });

    it('allows access via the getter', () => {
      expect(registry.getRole('Role.Collection.Tab')).to.deep.equal([ role ]);
    });

    it('publishes a role registered action', (done) => {
      const unsubscribe = Action.roleRegistered.listen((name) => {
        expect(name).to.equal('Role.Collection.Tab');
        unsubscribe();
        done();
      });
    });

    context('when the component already exists', () => {
      beforeEach(() => {
        registry.registerRole('Role.Collection.Tab', role);
      });

      it('does not register the duplicate', () => {
        expect(registry.roles['Role.Collection.Tab']).to.deep.equal([ role ]);
      });
    });

    context('when the component does not already exists', () => {
      context('when the role defines an order', () => {
        beforeEach(() => {
          registry.registerRole('Role.Collection.Tab', roleTwo);
        });

        it('registers the additional component in order', () => {
          expect(registry.roles['Role.Collection.Tab']).to.deep.equal([ roleTwo, role ]);
        });
      });

      context('when the role does not define an order', () => {
        beforeEach(() => {
          registry
            .registerRole('Role.Collection.Tab', roleTwo)
            .registerRole('Role.Collection.Tab', roleThree);
        });

        it('registers the additional component in order', () => {
          expect(registry.roles['Role.Collection.Tab']).to.deep.equal([ roleTwo, role, roleThree ]);
        });
      });
    });
  });

  describe('#registerStore', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry().registerStore('IndexStore', 'testing');
    });

    it('registers the store', () => {
      expect(registry.stores.IndexStore).to.equal('testing');
    });

    it('allows access via the getter', () => {
      expect(registry.getStore('IndexStore')).to.equal('testing');
    });

    it('publishes a store registered action', (done) => {
      const unsubscribe = Action.storeRegistered.listen((name) => {
        expect(name).to.equal('IndexStore');
        unsubscribe();
        done();
      });
    });

    context('when the store already exists', () => {
      beforeEach(() => {
        registry.registerStore('IndexStore', 'override');
      });

      it('publishes a store overridden action', (done) => {
        const unsubscribe = Action.storeOverridden.listen((name) => {
          expect(name).to.equal('IndexStore');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterAction', () => {
    context('when the action exists', () => {
      let registry;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerAction('TestAction', 'testing')
          .deregisterAction('TestAction');
      });

      it('deregisters the action', () => {
        expect(registry.actions.TestAction).to.equal(undefined);
      });

      it('publishes an action deregisted action', (done) => {
        const unsubscribe = Action.actionDeregistered.listen((name) => {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterComponent', () => {
    context('when the component exists', () => {
      let registry;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerComponent('TestComponent', 'testing')
          .deregisterComponent('TestComponent');
      });

      it('deregisters the component', () => {
        expect(registry.components.TestComponent).to.equal(undefined);
      });

      it('publishes a component deregisted action', (done) => {
        const unsubscribe = Action.componentDeregistered.listen((name) => {
          expect(name).to.equal('TestComponent');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterContainer', () => {
    context('when the container exists', () => {
      let registry;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerContainer('TestContainer', 'testing')
          .registerContainer('TestContainer', 'test')
          .deregisterContainer('TestContainer', 'testing');
      });

      it('deregisters the container', () => {
        expect(registry.containers.TestContainer).to.deep.equal([ 'test' ]);
      });

      it('publishes a container deregisted action', (done) => {
        const unsubscribe = Action.containerDeregistered.listen((name) => {
          expect(name).to.equal('TestContainer');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterRole', () => {
    const role = {
      component: 'collection-tab',
      name: 'another tab',
      order: 2,
      minimumServerVersion: '3.2.0-rc0'
    };

    const roleTwo = {
      component: 'collection-tab-two',
      name: 'another tab two',
      order: 1
    };

    context('when the role exists', () => {
      let registry;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerRole('TestRole', role)
          .registerRole('TestRole', roleTwo)
          .deregisterRole('TestRole', roleTwo);
      });

      it('deregisters the role', () => {
        expect(registry.roles.TestRole).to.deep.equal([ role ]);
      });

      it('publishes a role deregisted action', (done) => {
        const unsubscribe = Action.roleDeregistered.listen((name) => {
          expect(name).to.equal('TestRole');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterStore', () => {
    context('when the store exists', () => {
      let registry;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerStore('TestStore', 'testing')
          .deregisterStore('TestStore');
      });

      it('deregisters the store', () => {
        expect(registry.stores.TestStore).to.equal(undefined);
      });

      it('publishes a store deregisted action', (done) => {
        const unsubscribe = Action.storeDeregistered.listen((name) => {
          expect(name).to.equal('TestStore');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#emit', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry();
    });

    it('emits the event', (done) => {
      registry.once('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#on', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry();
    });

    it('subscribes to the event', (done) => {
      registry.on('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#once', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry();
    });

    it('subscribes to the event once', (done) => {
      registry.once('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#addListener', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry();
    });

    it('adds the listener to the event', (done) => {
      registry.addListener('test-event', (value) => {
        expect(value).to.equal('test');
        done();
      });
      registry.emit('test-event', 'test');
    });
  });

  describe('#removeListener', () => {
    let registry;
    const listener = () => { return true; };

    beforeEach(() => {
      registry = new AppRegistry();
      registry.addListener('test-event', listener);
    });

    it('removes the listener', () => {
      registry.removeListener('test-event', listener);
      expect(registry.listenerCount('test-event')).to.equal(0);
    });
  });

  describe('#removeAllListeners', () => {
    let registry;
    const listenerOne = () => { return true; };
    const listenerTwo = () => { return true; };

    beforeEach(() => {
      registry = new AppRegistry();
      registry.addListener('test-event', listenerOne);
      registry.addListener('test-event', listenerTwo);
    });

    it('removes all the listeners', () => {
      registry.removeAllListeners('test-event');
      expect(registry.listenerCount('test-event')).to.equal(0);
    });
  });

  describe('#setMaxListeners', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry();
    });

    it('returns the app registry', () => {
      expect(registry.setMaxListeners(50)).to.equal(registry);
    });

    it('modifies the max listeners', () => {
      registry.setMaxListeners(50);
      expect(registry.getMaxListeners()).to.equal(50);
    });
  });

  describe('#eventNames', () => {
    let registry;

    beforeEach(() => {
      registry = new AppRegistry();
      registry.on('test-event', () => { return true; });
    });

    it('returns the names of all events', () => {
      expect(registry.eventNames()).to.deep.equal(['test-event']);
    });
  });

  // emitter.listeners(eventName)
  // emitter.prependListener(eventName, listener)
  // emitter.prependOnceListener(eventName, listener)

  context('when freezing the app registry', () => {
    let registry;

    beforeEach(() => {
      registry = Object.freeze(new AppRegistry());
    });

    context('when adding a listener', () => {
      const addListener = () => {
        registry.on('test', () => { return true; });
      };

      it('allows the edition', () => {
        expect(addListener).to.not.throw();
      });
    });

    context('when registering an object', () => {
      const registerStore = () => {
        registry.registerStore('test', 'testing');
      };

      it('allows the registration', () => {
        expect(registerStore).to.not.throw();
      });
    });

    context('when deregistering an object', () => {
      beforeEach(() => {
        registry.registerStore('test', 'testing');
      });

      const deregisterStore = () => {
        registry.registerStore('test');
      };

      it('allows the registration', () => {
        expect(deregisterStore).to.not.throw();
      });
    });

    context('when modifying the object', () => {
      const modify = () => {
        registry.emit = () => {};
      };

      it('raises an error', () => {
        expect(modify).to.throw();
      });
    });
  });
});
