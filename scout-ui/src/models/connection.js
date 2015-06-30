var Model = require('ampersand-model');
var format = require('util').format;
var connectionSync = require('./connection-sync');

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
module.exports = Model.extend({
  namespace: 'Connection',
  idAttribute: 'name',
  props: {
    /**
     * User specified name for this connection.
     */
    name: {type: 'string', default: 'Local'},
    /**
     * Hostname or IP address of the Instance to connect to in the Deployment.
     */
    hostname: {type: 'string', default: 'localhost'},
    /**
     * Port the Instance to connect to in the Deployment is listening on.
     */
    port: {type: 'number', default: 27017},
    /**
     * Updated on each successful connection to the Deployment.
     */
    last_used: 'date'
  },
  derived: {
    uri: {
      deps: ['hostname', 'port'],
      fn: function(){
        return format('mongodb://%s:%d/', this.hostname, this.port);
      }
    }
  },
  sync: connectionSync
});
