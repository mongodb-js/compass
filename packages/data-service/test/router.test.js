var helper = require('./helper');

var expect = helper.expect;

var Router = require('../lib/router');

describe('Router', function() {
  var router = new Router();

  describe('#new', function() {
    it('initializes the routes', function() {
      expect(router.routes).to.have.length(9);
    });
  });

  describe('#resolve', function() {
    context('when the route is /instance', function() {
      var resolved = router.resolve('/instance');

      it('returns the instance method', function() {
        expect(resolved.method).to.equal('instance');
      });

      it('returns the instance arguments', function() {
        expect(resolved.args).to.have.length(0);
      });
    });

    context('when the route is /deployments', function() {
      var resolved = router.resolve('/deployments');

      it('returns the deployments method', function() {
        expect(resolved.method).to.equal('deployments');
      });

      it('returns the deployments arguments', function() {
        expect(resolved.args).to.have.length(0);
      });
    });

    context('when the route is /deployments/:deploymentId', function() {
      var resolved = router.resolve('/deployments/15');

      it('returns the deployment method', function() {
        expect(resolved.method).to.equal('deployment');
      });

      it('returns the deployment arguments', function() {
        expect(resolved.args[0]).to.equal('15');
      });
    });

    context('when the route is /databases/:database', function() {
      var resolved = router.resolve('/databases/testing');

      it('returns the database method', function() {
        expect(resolved.method).to.equal('database');
      });

      it('returns the database arguments', function() {
        expect(resolved.args[0]).to.equal('testing');
      });
    });

    context('when the route is /collections/:ns', function() {
      var resolved = router.resolve('/collections/data-service');

      it('returns the collection method', function() {
        expect(resolved.method).to.equal('collection');
      });

      it('returns the collection arguments', function() {
        expect(resolved.args[0]).to.equal('data-service');
      });
    });

    context('when the route is /collections/:ns/count', function() {
      var resolved = router.resolve('/collections/data-service/count');

      it('returns the count method', function() {
        expect(resolved.method).to.equal('count');
      });

      it('returns the count arguments', function() {
        expect(resolved.args[0]).to.equal('data-service');
      });
    });

    context('when the route is /collections/:ns/find', function() {
      var resolved = router.resolve('/collections/data-service/find');

      it('returns the find method', function() {
        expect(resolved.method).to.equal('find');
      });

      it('returns the find arguments', function() {
        expect(resolved.args[0]).to.equal('data-service');
      });
    });

    context('when the route is /collections/:ns/aggregate', function() {
      var resolved = router.resolve('/collections/data-service/aggregate');

      it('returns the aggregate method', function() {
        expect(resolved.method).to.equal('aggregate');
      });

      it('returns the aggregate arguments', function() {
        expect(resolved.args[0]).to.equal('data-service');
      });
    });
  });
});
