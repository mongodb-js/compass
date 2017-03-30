'use strict';

const expect = require('chai').expect;
const Action = require('../lib/actions');
const AppRegistry = require('../lib/app-registry');

describe('AppRegistry', () => {
  describe('#registerAction', () => {
    let registry = null;

    beforeEach(() => {
      registry = new AppRegistry().registerAction('TestAction', 'testing');
    });

    it('registers the action', () => {
      expect(registry.actions.TestAction).to.equal('testing');
    });

    it('allows access via the getter', () => {
      expect(registry.getAction('TestAction')).to.equal('testing');
    });

    it('publishes an action registered action', function(done) {
      const unsubscribe = Action.actionRegistered.listen(function(name) {
        expect(name).to.equal('TestAction');
        unsubscribe();
        done();
      });
    });

    context('when the action already exists', () => {
      beforeEach(() => {
        registry.registerAction('TestAction', 'override');
      });

      it('publishes an action overridden action', function(done) {
        const unsubscribe = Action.actionOverridden.listen(function(name) {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerContainer', () => {
    let registry = null;

    beforeEach(() => {
      registry = new AppRegistry().registerContainer('Collection.Tab', 'test');
    });

    it('registers the component', () => {
      expect(registry.containers['Collection.Tab']).to.deep.equal([ 'test' ]);
    });

    it('allows access via the getter', () => {
      expect(registry.getContainer('Collection.Tab')).to.deep.equal([ 'test' ]);
    });

    it('publishes a container registered action', function(done) {
      const unsubscribe = Action.containerRegistered.listen(function(name) {
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
    let registry = null;

    beforeEach(() => {
      registry = new AppRegistry().registerComponent('IndexView', 'testing');
    });

    it('registers the component', () => {
      expect(registry.components.IndexView).to.equal('testing');
    });

    it('allows access via the getter', () => {
      expect(registry.getComponent('IndexView')).to.equal('testing');
    });

    it('publishes a component registered action', function(done) {
      const unsubscribe = Action.componentRegistered.listen(function(name) {
        expect(name).to.equal('IndexView');
        unsubscribe();
        done();
      });
    });

    context('when the component already exists', () => {
      beforeEach(() => {
        registry.registerComponent('IndexView', 'override');
      });

      it('publishes a component overridden action', function(done) {
        const unsubscribe = Action.componentOverridden.listen(function(name) {
          expect(name).to.equal('IndexView');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerRole', () => {
    let registry = null;

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

    it('publishes a role registered action', function(done) {
      const unsubscribe = Action.roleRegistered.listen(function(name) {
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
    let registry = null;

    beforeEach(() => {
      registry = new AppRegistry().registerStore('IndexStore', 'testing');
    });

    it('registers the store', () => {
      expect(registry.stores.IndexStore).to.equal('testing');
    });

    it('allows access via the getter', () => {
      expect(registry.getStore('IndexStore')).to.equal('testing');
    });

    it('publishes a store registered action', function(done) {
      const unsubscribe = Action.storeRegistered.listen(function(name) {
        expect(name).to.equal('IndexStore');
        unsubscribe();
        done();
      });
    });

    context('when the store already exists', () => {
      beforeEach(() => {
        registry.registerStore('IndexStore', 'override');
      });

      it('publishes a store overridden action', function(done) {
        const unsubscribe = Action.storeOverridden.listen(function(name) {
          expect(name).to.equal('IndexStore');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterAction', () => {
    context('when the action exists', () => {
      let registry = null;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerAction('TestAction', 'testing')
          .deregisterAction('TestAction');
      });

      it('deregisters the action', () => {
        expect(registry.actions.TestAction).to.equal(undefined);
      });

      it('publishes an action deregisted action', function(done) {
        const unsubscribe = Action.actionDeregistered.listen(function(name) {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterComponent', () => {
    context('when the component exists', () => {
      let registry = null;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerComponent('TestComponent', 'testing')
          .deregisterComponent('TestComponent');
      });

      it('deregisters the component', () => {
        expect(registry.components.TestComponent).to.equal(undefined);
      });

      it('publishes a component deregisted action', function(done) {
        const unsubscribe = Action.componentDeregistered.listen(function(name) {
          expect(name).to.equal('TestComponent');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterContainer', () => {
    context('when the container exists', () => {
      let registry = null;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerContainer('TestContainer', 'testing')
          .registerContainer('TestContainer', 'test')
          .deregisterContainer('TestContainer', 'testing');
      });

      it('deregisters the container', () => {
        expect(registry.containers.TestContainer).to.deep.equal([ 'test' ]);
      });

      it('publishes a container deregisted action', function(done) {
        const unsubscribe = Action.containerDeregistered.listen(function(name) {
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
      let registry = null;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerRole('TestRole', role)
          .registerRole('TestRole', roleTwo)
          .deregisterRole('TestRole', roleTwo);
      });

      it('deregisters the role', () => {
        expect(registry.roles.TestRole).to.deep.equal([ role ]);
      });

      it('publishes a role deregisted action', function(done) {
        const unsubscribe = Action.roleDeregistered.listen(function(name) {
          expect(name).to.equal('TestRole');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterStore', () => {
    context('when the store exists', () => {
      let registry = null;

      beforeEach(() => {
        registry = new AppRegistry()
          .registerStore('TestStore', 'testing')
          .deregisterStore('TestStore');
      });

      it('deregisters the store', () => {
        expect(registry.stores.TestStore).to.equal(undefined);
      });

      it('publishes a store deregisted action', function(done) {
        const unsubscribe = Action.storeDeregistered.listen(function(name) {
          expect(name).to.equal('TestStore');
          unsubscribe();
          done();
        });
      });
    });
  });
});
