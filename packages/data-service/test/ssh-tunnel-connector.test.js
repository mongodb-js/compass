'use strict';

const helper = require('./helper');
const assert = helper.assert;
const expect = helper.expect;

const NativeClient = require('../lib/native-client');
const fixture = require('mongodb-connection-fixture');
const Connection = require('mongodb-connection-model');
const SshTunnelConnector = require('../lib/ssh-tunnel-connector');
const _ = require('lodash');

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
  describe('#regression', function() {
    /**
     * @see https://jira.mongodb.org/browse/INT-1510
     */
    it('should error when ssh fails', function(done) {
      var connector = new SshTunnelConnector({
        dstHost: 'localhost',
        dstPort: 27107,
        username: 'foo',
        password: 'bar',
        host: 'remotehost',
        sshPort: 22
      });

      connector.connect(function(err) {
        expect(err).not.to.equal(null, 'should have an error');
        expect(err).not.to.equal(undefined, 'should have an error');
        done();
      });
    });
  });
});
