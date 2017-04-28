const helper = require('./helper');

const expect = helper.expect;

const Actions = require('../lib/actions');
const Store = require('../lib/data-service-store');

describe('DataServiceStore', function() {
  before(require('mongodb-runner/mocha/before')({
    port: 27018
  }));
  after(require('mongodb-runner/mocha/after')());

  it('triggers on connect', function(done) {
    var unsubscribe = Store.listen(function(error, dataService) {
      expect(error).to.equal(null);
      expect(dataService).to.not.equal(null);
      unsubscribe();
      done();
    });
    Actions.connect(helper.connection);
  });
});
