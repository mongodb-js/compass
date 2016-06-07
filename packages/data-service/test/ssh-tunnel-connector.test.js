var helper = require('./helper');

var assert = helper.assert;
var expect = helper.expect;

var NativeClient = require('../lib/native-client');
var fixture = require('mongodb-connection-fixture');
var Connection = require('mongodb-connection-model');
var SshTunnelConnector = require('../lib/ssh-tunnel-connector');
var _ = require('lodash');

describe('SshTunnelConnector', function() {
  this.timeout(15000);

  if (fixture.SSH_TUNNEL_MATRIX.length > 0) {
    _.map(fixture.SSH_TUNNEL_MATRIX, function(model) {
      var connection = new Connection(model);
      var client = new NativeClient(connection);

      describe('#connect', function() {
        var connector = new SshTunnelConnector(connection.ssh_tunnel_options);

        it('connects to the ssh tunnel', function(done) {
          connector.connect(function() {
            client.connect(function(err) {
              expect(err).to.equal(null);
              client.find('mongodb.fanclub', {}, { limit: 10 }, function(error, docs) {
                assert.equal(null, error);
                expect(docs.length).to.equal(10);
                done();
              });
            });
          });
        });
      });
    });
  }
});
