'use strict';

const expect = require('chai').expect;
const Action = require('../lib/actions');
const AppRegistry = require('../lib/app-registry');

describe('AppRegistry', function() {
  describe('#registerAction', function() {
    var registry = null;

    beforeEach(function() {
      registry = new AppRegistry().registerAction('TestAction', 'testing');
    });

    it('registers the action', function() {
      expect(registry.actions.TestAction).to.equal('testing');
    });

    it('allows access via the getter', function() {
      expect(registry.getAction('TestAction')).to.equal('testing');
    });

    it('publishes an action registered action', function(done) {
      var unsubscribe = Action.actionRegistered.listen(function(name) {
        expect(name).to.equal('TestAction');
        unsubscribe();
        done();
      });
    });

    context('when the action already exists', function() {
      beforeEach(function() {
        registry.registerAction('TestAction', 'override');
      });

      it('publishes an action overridden action', function(done) {
        var unsubscribe = Action.actionOverridden.listen(function(name) {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerComponent', function() {
    var registry = null;

    beforeEach(function() {
      registry = new AppRegistry().registerComponent('IndexView', 'testing');
    });

    it('registers the component', function() {
      expect(registry.components.IndexView).to.equal('testing');
    });

    it('allows access via the getter', function() {
      expect(registry.getComponent('IndexView')).to.equal('testing');
    });

    it('publishes a component registered action', function(done) {
      var unsubscribe = Action.componentRegistered.listen(function(name) {
        expect(name).to.equal('IndexView');
        unsubscribe();
        done();
      });
    });

    context('when the component already exists', function() {
      beforeEach(function() {
        registry.registerComponent('IndexView', 'override');
      });

      it('publishes a component overridden action', function(done) {
        var unsubscribe = Action.componentOverridden.listen(function(name) {
          expect(name).to.equal('IndexView');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#registerStore', function() {
    var registry = null;

    beforeEach(function() {
      registry = new AppRegistry().registerStore('IndexStore', 'testing');
    });

    it('registers the store', function() {
      expect(registry.stores.IndexStore).to.equal('testing');
    });

    it('allows access via the getter', function() {
      expect(registry.getStore('IndexStore')).to.equal('testing');
    });

    it('publishes a store registered action', function(done) {
      var unsubscribe = Action.storeRegistered.listen(function(name) {
        expect(name).to.equal('IndexStore');
        unsubscribe();
        done();
      });
    });

    context('when the store already exists', function() {
      beforeEach(function() {
        registry.registerStore('IndexStore', 'override');
      });

      it('publishes a store overridden action', function(done) {
        var unsubscribe = Action.storeOverridden.listen(function(name) {
          expect(name).to.equal('IndexStore');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterAction', function() {
    context('when the action exists', function() {
      var registry = null;

      beforeEach(function() {
        registry = new AppRegistry()
          .registerAction('TestAction', 'testing')
          .deregisterAction('TestAction');
      });

      it('deregisters the action', function() {
        expect(registry.actions.TestAction).to.equal(undefined);
      });

      it('publishes an action deregisted action', function(done) {
        var unsubscribe = Action.actionDeregistered.listen(function(name) {
          expect(name).to.equal('TestAction');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterComponent', function() {
    context('when the component exists', function() {
      var registry = null;

      beforeEach(function() {
        registry = new AppRegistry()
          .registerComponent('TestComponent', 'testing')
          .deregisterComponent('TestComponent');
      });

      it('deregisters the component', function() {
        expect(registry.components.TestComponent).to.equal(undefined);
      });

      it('publishes a component deregisted action', function(done) {
        var unsubscribe = Action.componentDeregistered.listen(function(name) {
          expect(name).to.equal('TestComponent');
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterStore', function() {
    context('when the store exists', function() {
      var registry = null;

      beforeEach(function() {
        registry = new AppRegistry()
          .registerStore('TestStore', 'testing')
          .deregisterStore('TestStore');
      });

      it('deregisters the store', function() {
        expect(registry.stores.TestStore).to.equal(undefined);
      });

      it('publishes a store deregisted action', function(done) {
        var unsubscribe = Action.storeDeregistered.listen(function(name) {
          expect(name).to.equal('TestStore');
          unsubscribe();
          done();
        });
      });
    });
  });
});
