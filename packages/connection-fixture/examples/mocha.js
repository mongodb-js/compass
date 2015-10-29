var fixtures = require('../').MATRIX;
var connect = require('mongodb-connection-model').connect;
var format = require('util').format;

if (fixtures.length === 0) {
  describe(format('Connect to %d instances in the cloud #slow', fixtures.length), function() {
    it.skip('please see https://github.com/mongodb-js/connection-fixture');
  });
} else {
  describe(format('Connect to %d instances in the cloud #slow', fixtures.length), function() {
    fixtures.map(function(model) {
      if (process.env.dry) {
        it(format('should connect to `%s`', model.name));
      } else {
        it(format('should connect to `%s`', model.name), function(done) {
          this.slow(5000);
          this.timeout(10000);
          connect(model, done);
        });
      }
    });
  });
}
