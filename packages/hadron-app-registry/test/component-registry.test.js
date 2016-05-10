'use strict';

require('./helper');

const expect = require('chai').expect;
const Action = require('hadron-action');
const ComponentRegistry = require('../lib/component-registry');
const ExampleComponent = require('./example-component');

describe('ComponentRegistry', function() {
  describe('#register', function() {
    var componentRegistry = null;

    beforeEach(function() {
      componentRegistry = new ComponentRegistry().register(
        ExampleComponent,
        { container: 'IndexView' }
      );
    });

    context('when provided a container', function() {
      it('registers the component to the container', function() {
        var registeredComponent = componentRegistry.registry.ExampleComponent.component;
        expect(registeredComponent).to.equal(ExampleComponent);
      });

      it('maps the container option', function() {
        var exampleContainer = componentRegistry.registry.ExampleComponent.container;
        expect(exampleContainer).to.equal('IndexView');
      });

      it('publishes a component registered action', function(done) {
        var unsubscribe = Action.componentRegistered.listen(function(component) {
          expect(component).to.equal(ExampleComponent);
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#findByContainer', function() {
    context('when matching components exist', function() {
      var componentRegistry = null;

      beforeEach(function() {
        componentRegistry = new ComponentRegistry().register(
          ExampleComponent,
          { container: 'IndexView' }
        );
      });

      it('returns the components', function() {
        expect(componentRegistry.findByContainer('IndexView')).to.have.length(1);
      });
    });

    context('when no matching components exist', function() {
      var componentRegistry = null;

      beforeEach(function() {
        componentRegistry = new ComponentRegistry();
      });

      it('returns an empty collection', function() {
        expect(componentRegistry.findByContainer('IndexView')).to.have.length(0);
      });
    });
  });

  describe('#findByRole', function() {
    var role = 'Connect:Authentication';

    context('when matching components exist', function() {
      var componentRegistry = null;

      beforeEach(function() {
        componentRegistry = new ComponentRegistry().register(
          ExampleComponent,
          { role: role }
        );
      });

      it('returns the components', function() {
        expect(componentRegistry.findByRole(role)).to.have.length(1);
      });
    });

    context('when no matching components exist', function() {
      var componentRegistry = null;

      beforeEach(function() {
        componentRegistry = new ComponentRegistry();
      });

      it('returns an empty collection', function() {
        expect(componentRegistry.findByRole(role)).to.have.length(0);
      });
    });
  });

  describe('#deregister', function() {
    context('when the component exists', function() {
      var componentRegistry = null;

      beforeEach(function() {
        componentRegistry = new ComponentRegistry().register(
          ExampleComponent,
          { container: 'IndexView' }
        ).deregister(ExampleComponent);
      });

      it('deregisters the component', function() {
        expect(componentRegistry.registry.ExampleComponent).to.equal(undefined);
      });

      it('publishes a component deregisted action', function(done) {
        var unsubscribe = Action.componentDeregistered.listen(function(component) {
          expect(component).to.equal(ExampleComponent);
          unsubscribe();
          done();
        });
      });
    });
  });

  describe('#deregisterAll', function() {
    var componentRegistry = null;

    beforeEach(function() {
      componentRegistry = new ComponentRegistry().register(
        ExampleComponent,
        { container: 'IndexView' }
      ).deregisterAll();
    });

    it('deregisters all components', function() {
      expect(componentRegistry.registry.ExampleComponent).to.equal(undefined);
    });

    it('publishes a component deregisted action for each component', function(done) {
      var unsubscribe = Action.componentDeregistered.listen(function(component) {
        expect(component).to.equal(ExampleComponent);
        unsubscribe();
        done();
      });
    });
  });
});
