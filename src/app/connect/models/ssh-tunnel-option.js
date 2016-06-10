var State = require('ampersand-state');
var Connection = require('../../models/connection');

var SSHTunnelOption = State.extend({
  namespace: 'SSHTunnelOption',
  mainIndex: '_id',
  props: {
    _id: {
      type: 'string',
      values: Connection.SSH_TUNNEL_VALUES,
      default: Connection.SSH_TUNNEL_DEFAULT
    },
    title: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    selected: {
      type: 'boolean',
      default: false
    },
    enabled: {
      type: 'boolean',
      default: true
    },
    fields: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  }
});

module.exports = SSHTunnelOption;
